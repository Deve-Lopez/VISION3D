import { useState, useRef, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress, Html, Grid, Environment } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { uploadToCloudinary } from "./cloudinary";
import "./index.css";

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

function ModelGLTF({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ModelSTL({ url }) {
  const [geometry, setGeometry] = useState(null);
  useEffect(() => {
    new STLLoader().load(url, (geo) => {
      geo.computeVertexNormals();
      setGeometry(geo);
    });
  }, [url]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#8ecae6" metalness={0.3} roughness={0.5} />
    </mesh>
  );
}

function ModelOBJ({ url }) {
  const [obj, setObj] = useState(null);
  useEffect(() => {
    new OBJLoader().load(url, (object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (!child.material || child.material.type === "MeshBasicMaterial") {
            child.material = new THREE.MeshStandardMaterial({
              color: "#8ecae6",
              metalness: 0.3,
              roughness: 0.5,
            });
          }
        }
      });
      setObj(object);
    });
  }, [url]);
  if (!obj) return null;
  return <primitive object={obj} />;
}

function Model({ url, ext }) {
  if (ext === "stl") return <ModelSTL url={url} />;
  if (ext === "obj") return <ModelOBJ url={url} />;
  return <ModelGLTF url={url} />;
}

function Scene({ modelUrl, modelExt, showGrid, envPreset }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      <Environment preset={envPreset} />
      {showGrid && (
        <Grid
          infiniteGrid
          cellSize={0.5}
          cellThickness={0.5}
          sectionSize={3}
          sectionThickness={1}
          fadeDistance={30}
          cellColor="#334155"
          sectionColor="#475569"
        />
      )}
      <Suspense fallback={<Loader />}>
        {modelUrl && (
          <group>
            <Model url={modelUrl} ext={modelExt} />
          </group>
        )}
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
    </>
  );
}

const ENV_PRESETS = ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "lobby"];

export default function App() {
  const [modelUrl, setModelUrl] = useState(null);
  const [modelExt, setModelExt] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [envPreset, setEnvPreset] = useState("sunset");
  const [bgColor, setBgColor] = useState("#0f172a");
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["glb", "gltf", "stl", "obj"].includes(ext)) {
      setError("Solo se admiten archivos .glb, .gltf, .stl y .obj");
      return;
    }
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    setFileName(file.name);
    setModelExt(ext);
    try {
      const url = await uploadToCloudinary(file, (p) => setUploadProgress(p));
      setModelUrl(url);
    } catch (e) {
      setError("Error al subir el archivo. Revisa la configuración de Cloudinary.");
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">VISION3D</span>
        </div>

        {/* Upload zone */}
        <div
          className={`drop-zone ${uploading ? "uploading" : ""}`}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf,.stl,.obj"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="upload-progress">
              <div className="spinner" />
              <p>Subiendo modelo...</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="progress-pct">{uploadProgress}%</span>
            </div>
          ) : (
            <>
              <div className="drop-icon">⬆</div>
              <p className="drop-title">Arrastra tu modelo</p>
              <p className="drop-sub">.glb · .gltf · .stl · .obj</p>
              {fileName && <p className="drop-file">✓ {fileName}</p>}
            </>
          )}
        </div>

        {error && <p className="error-msg">{error}</p>}

        {/* Controls */}
        <div className="controls-section">
          <p className="section-label">Escena</p>

          <label className="control-row">
            <span>Cuadrícula</span>
            <button
              className={`toggle ${showGrid ? "on" : ""}`}
              onClick={() => setShowGrid((v) => !v)}
            >
              <span className="toggle-knob" />
            </button>
          </label>

          <label className="control-row">
            <span>Fondo</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="color-pick"
            />
          </label>

          <p className="section-label" style={{ marginTop: "16px" }}>Entorno</p>
          <div className="env-grid">
            {ENV_PRESETS.map((p) => (
              <button
                key={p}
                className={`env-btn ${envPreset === p ? "active" : ""}`}
                onClick={() => setEnvPreset(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <p>Orbit · Scroll zoom · Shift+drag pan</p>
        </div>
      </aside>

      {/* Canvas */}
      <main className="canvas-wrap" style={{ background: bgColor }}>
        {!modelUrl && !uploading && (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <p>Carga un modelo para empezar</p>
          </div>
        )}
        <Canvas
          shadows
          camera={{ position: [3, 3, 3], fov: 50 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Scene
            modelUrl={modelUrl}
            modelExt={modelExt}
            showGrid={showGrid}
            envPreset={envPreset}
          />
        </Canvas>
      </main>
    </div>
  );
}
