import { useRef, useState, useEffect } from "react";
import { uploadToStorage, listModelsFromStorage } from "../storage";

const ENV_PRESETS = ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "lobby"];
const VALID_EXT = ["glb", "gltf", "stl", "obj"];

export default function Sidebar({
  fileName, error, setError, setBlobUrl, setModelExt, setFileName, prevBlob,
  showGrid, setShowGrid, showWireframe, setShowWireframe,
  bgColor, setBgColor, envPreset, setEnvPreset,
  uploading, setUploading, setShareUrl
}) {
  const inputRef = useRef();
  const [cloudModels, setCloudModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  async function fetchCloudModels() {
    setLoadingModels(true);
    try {
      const models = await listModelsFromStorage();
      setCloudModels(models);
    } catch (e) {
      console.error("Error al cargar la galería:", e.message);
    } finally {
      setLoadingModels(false);
    }
  }

  useEffect(() => {
    fetchCloudModels();
  }, []);

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!VALID_EXT.includes(ext)) {
      setError("Solo se admiten .glb, .gltf, .stl y .obj");
      return;
    }
    if (prevBlob.current) URL.revokeObjectURL(prevBlob.current);
    const localUrl = URL.createObjectURL(file);
    prevBlob.current = localUrl;
    setError(null);
    setBlobUrl(localUrl);
    setModelExt(ext);
    setFileName(file.name);
    if (uploading) return;
    setUploading(true);
    try {
      const { url, local } = await uploadToStorage(file);
      setShareUrl(url);
      if (local) {
        console.info("Modelo cargado localmente (más de 50MB, no guardado en la nube)");
      } else {
        fetchCloudModels();
      }
    } catch (e) {
      console.error("Error en backup silencioso:", e.message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  function handleSelectCloudModel(model) {
    setError(null);
    setBlobUrl(model.url);
    setModelExt(model.ext);
    setFileName(model.name);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">◈</span>
        <span className="logo-text">VISION3D</span>
      </div>

      <div className="drop-zone" onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" accept=".glb,.gltf,.stl,.obj" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        <div className="drop-icon">⬆</div>
        <p className="drop-title">Arrastra tu modelo</p>
        <p className="drop-sub">.glb · .gltf · .stl · .obj</p>
        {fileName && <p className="drop-file">✓ {fileName}</p>}
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="controls-section" style={{ marginTop: "16px" }}>
        <p className="section-label">Modelos en la nube</p>
        {loadingModels ? (
          <p style={{ fontSize: "12px", color: "#64748b" }}>Conectando con la nube...</p>
        ) : cloudModels.length === 0 ? (
          <p style={{ fontSize: "12px", color: "#64748b" }}>No hay modelos guardados.</p>
        ) : (
          <div className="cloud-list" style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", background: "#1e293b", padding: "8px", borderRadius: "6px" }}>
            {cloudModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelectCloudModel(model)}
                style={{
                  textAlign: "left",
                  background: fileName === model.name ? "#3b82f6" : "#0f172a",
                  color: fileName === model.name ? "white" : "#94a3b8",
                  border: "none",
                  padding: "8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  transition: "background 0.2s"
                }}
              >
                📦 {model.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="controls-section" style={{ marginTop: "16px" }}>
        <p className="section-label">Escena</p>
        <label className="control-row">
          <span>Cuadrícula</span>
          <button className={`toggle ${showGrid ? "on" : ""}`} onClick={() => setShowGrid(v => !v)}>
            <span className="toggle-knob" />
          </button>
        </label>
        <label className="control-row">
          <span>Malla</span>
          <button className={`toggle ${showWireframe ? "on" : ""}`} onClick={() => setShowWireframe(v => !v)}>
            <span className="toggle-knob" />
          </button>
        </label>
        <label className="control-row">
          <span>Fondo</span>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="color-pick" />
        </label>
        <p className="section-label" style={{ marginTop: "16px" }}>Entorno</p>
        <div className="env-grid">
          {ENV_PRESETS.map((p) => (
            <button key={p} className={`env-btn ${envPreset === p ? "active" : ""}`} onClick={() => setEnvPreset(p)}>{p}</button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <p>Clic · Rotar libre · Scroll zoom · Clic derecho · Pan</p>
      </div>
    </aside>
  );
}