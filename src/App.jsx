import { useState, useRef, Suspense, useEffect, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress, Html, Grid, Environment } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { uploadToCloudinary } from "./cloudinary";
import "./index.css";

// ── Centra y escala cualquier objeto/geometría al viewport ──
function fitToView(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.5 / maxDim;
  object.position.sub(center.multiplyScalar(scale));
  object.scale.setScalar(scale);
}

function fitGeometryToView(geo) {
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.5 / maxDim;
  geo.translate(-center.x, -center.y, -center.z);
  return scale;
}

// ── Loaders ──
function ModelGLTF({ url }) {
  const { scene } = useGLTF(url);
  useEffect(() => { fitToView(scene); }, [scene]);
  return <primitive object={scene} />;
}

function ModelSTL({ url }) {
  const [mesh, setMesh] = useState(null);
  useEffect(() => {
    let revoked = false;
    new STLLoader().load(url, (geo) => {
      if (revoked) return;
      geo.computeVertexNormals();
      const scale = fitGeometryToView(geo);
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color: "#8ecae6", metalness: 0.3, roughness: 0.5 })
      );
      m.scale.setScalar(scale);
      m.castShadow = true;
      m.receiveShadow = true;
      setMesh(m);
    });
    return () => { revoked = true; };
  }, [url]);
  if (!mesh) return null;
  return <primitive object={mesh} />;
}

function ModelOBJ({ url }) {
  const [obj, setObj] = useState(null);
  useEffect(() => {
    let revoked = false;
    new OBJLoader().load(url, (object) => {
      if (revoked) return;
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshStandardMaterial({
            color: "#8ecae6", metalness: 0.3, roughness: 0.5,
          });
        }
      });
      fitToView(object);
      setObj(object);
    });
    return () => { revoked = true; };
  }, [url]);
  if (!obj) return null;
  return <primitive object={obj} />;
}

function Model({ url, ext }) {
  if (ext === "stl") return <ModelSTL url={url} />;
  if (ext === "obj") return <ModelOBJ url={url} />;
  return <ModelGLTF url={url} />;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader-3d">
        <div className="loader-bar">
          <div className="loader-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

function Scene({ modelUrl, modelExt, showGrid, envPreset }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      <Environment preset={envPreset} />
      {showGrid && (
        <Grid infiniteGrid cellSize={0.5} cellThickness={0.5}
          sectionSize={3} sectionThickness={1} fadeDistance={30}
          cellColor="#334155" sectionColor="#475569" />
      )}
      <Suspense fallback={<Loader />}>
        {modelUrl && <Model url={modelUrl} ext={modelExt} />}
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
    </>
  );
}

const ENV_PRESETS = ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "lobby"];
const VALID_EXT = ["glb", "gltf", "stl", "obj"];

export default function App() {
  // blobUrl = renderizado inmediato desde disco local
  // cloudUrl = URL permanente tras subida (para compartir)
  const [blobUrl, setBlobUrl]           = useState(null);
  const [modelExt, setModelExt]         = useState(null);
  const [fileName, setFileName]         = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone]     = useState(false);
  const [shareUrl, setShareUrl]         = useState(null);
  const [error, setError]               = useState(null);
  const [showGrid, setShowGrid]         = useState(true);
  const [envPreset, setEnvPreset]       = useState("sunset");
  const [bgColor, setBgColor]           = useState("#0f172a");
  const [copied, setCopied]             = useState(false);
  const prevBlob = useRef(null);
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!VALID_EXT.includes(ext)) {
      setError("Solo se admiten .glb, .gltf, .stl y .obj");
      return;
    }

    // 1. Renderizar YA desde el archivo local (sin red)
    if (prevBlob.current) URL.revokeObjectURL(prevBlob.current);
    const localUrl = URL.createObjectURL(file);
    prevBlob.current = localUrl;

    setError(null);
    setUploadDone(false);
    setShareUrl(null);
    setBlobUrl(localUrl);
    setModelExt(ext);
    setFileName(file.name);

    // 2. Subir a Cloudinary en segundo plano
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadToCloudinary(file, (p) => setUploadProgress(p));
      setShareUrl(url);
      setUploadDone(true);
    } catch (e) {
      setError("Subida fallida. El modelo se ve localmente pero no se puede compartir.");
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  function copyShareUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">VISION3D</span>
        </div>

        {/* Drop zone */}
        <div
          className="drop-zone"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current.click()}
        >
          <input ref={inputRef} type="file" accept=".glb,.gltf,.stl,.obj"
            style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          <div className="drop-icon">⬆</div>
          <p className="drop-title">Arrastra tu modelo</p>
          <p className="drop-sub">.glb · .gltf · .stl · .obj</p>
          {fileName && <p className="drop-file">✓ {fileName}</p>}
        </div>

        {/* Estado de subida */}
        {uploading && (
          <div className="upload-status">
            <div className="upload-status-row">
              <div className="spinner-sm" />
              <span>Guardando en la nube…</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {uploadDone && shareUrl && (
          <div className="share-box">
            <p className="share-label">URL para compartir</p>
            <div className="share-row">
              <span className="share-url">{shareUrl.slice(0, 32)}…</span>
              <button className="copy-btn" onClick={copyShareUrl}>
                {copied ? "✓" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}

        {/* Controls */}
        <div className="controls-section">
          <p className="section-label">Escena</p>
          <label className="control-row">
            <span>Cuadrícula</span>
            <button className={`toggle ${showGrid ? "on" : ""}`} onClick={() => setShowGrid(v => !v)}>
              <span className="toggle-knob" />
            </button>
          </label>
          <label className="control-row">
            <span>Fondo</span>
            <input type="color" value={bgColor}
              onChange={(e) => setBgColor(e.target.value)} className="color-pick" />
          </label>
          <p className="section-label" style={{ marginTop: "16px" }}>Entorno</p>
          <div className="env-grid">
            {ENV_PRESETS.map((p) => (
              <button key={p} className={`env-btn ${envPreset === p ? "active" : ""}`}
                onClick={() => setEnvPreset(p)}>{p}</button>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <p>Orbit · Scroll zoom · Shift+drag pan</p>
        </div>
      </aside>

      <main className="canvas-wrap" style={{ background: bgColor }}>
        {!blobUrl && (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <p>Carga un modelo para empezar</p>
          </div>
        )}
        <Canvas shadows camera={{ position: [3, 3, 3], fov: 50 }}
          style={{ width: "100%", height: "100%" }}>
          <Scene modelUrl={blobUrl} modelExt={modelExt}
            showGrid={showGrid} envPreset={envPreset} />
        </Canvas>
      </main>
    </div>
  );
}
