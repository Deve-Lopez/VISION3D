import { useRef, useState, useEffect } from "react";
import { uploadToStorage, listModelsFromStorage } from "../../storage";
// Importamos el módulo de estilos
import styles from "./Sidebar.module.css";

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
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>VISION3D</span>
      </div>

      <div className={styles.dropZone} onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" accept=".glb,.gltf,.stl,.obj" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        <div className={styles.dropIcon}>⬆</div>
        <p className={styles.dropTitle}>Arrastra tu modelo</p>
        <p className={styles.dropSub}>.glb · .gltf · .stl · .obj</p>
        {fileName && <p className={styles.dropFile}>✓ {fileName}</p>}
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={`${styles.controlsSection} ${styles.mtMd}`}>
        <p className={styles.sectionLabel}>Modelos en la nube</p>
        {loadingModels ? (
          <p className={styles.dropSub}>Conectando con la nube...</p>
        ) : cloudModels.length === 0 ? (
          <p className={styles.dropSub}>No hay modelos guardados.</p>
        ) : (
          <div className={styles.cloudList}>
            {cloudModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelectCloudModel(model)}
                className={`${styles.cloudItem} ${fileName === model.name ? styles.active : ""}`}
              >
                📦 {model.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`${styles.controlsSection} ${styles.mtMd}`}>
        <p className={styles.sectionLabel}>Escena</p>

        {/* CONTROL: Cuadrícula */}
        <label className={styles.controlRow}>
          <span>Cuadrícula</span>
          {/* Aquí usamos showGrid y setShowGrid */}
          <button className={`${styles.toggle} ${showGrid ? styles.on : ""}`} onClick={() => setShowGrid(v => !v)}>
            <span className={styles.toggleKnob} />
          </button>
        </label>

        {/* CONTROL: Malla (REVISA ESTO) */}
        <label className={styles.controlRow}>
          <span>Malla</span>
          {/* CORRECCIÓN: Aquí DEBE usar showWireframe y setShowWireframe */}
          <button className={`${styles.toggle} ${showWireframe ? styles.on : ""}`} onClick={() => setShowWireframe(v => !v)}>
            <span className={styles.toggleKnob} />
          </button>
        </label>

        {/* CONTROL: Fondo */}
        <label className={styles.controlRow}>
          <span>Fondo</span>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={styles.colorPick} />
        </label>

        <p className={`${styles.sectionLabel} ${styles.mtMd}`}>Entorno</p>
        <div className={styles.envGrid}>
          {ENV_PRESETS.map((p) => (
            <button key={p} className={`${styles.envBtn} ${envPreset === p ? styles.active : ""}`} onClick={() => setEnvPreset(p)}>{p}</button>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        <p>Clic · Rotar libre · Scroll zoom · Clic derecho · Pan</p>
      </div>
    </aside>
  );
}