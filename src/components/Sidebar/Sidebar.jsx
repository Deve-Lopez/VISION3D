import { useRef, useState, useEffect } from "react";
// Importamos funciones externas para interactuar con Firebase o el almacenamiento en la nube
import { uploadToStorage, listModelsFromStorage } from "../../storage";
// Importamos el objeto de estilos locales protegidos (CSS Modules)
import styles from "./Sidebar.module.css";

// Lista estática de nombres limpios para los botones de entorno de iluminación
const ENV_PRESETS = ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "lobby"];
// Extensiones de archivos 3D permitidas por el cargador de la app
const VALID_EXT = ["glb", "gltf", "stl", "obj"];

// Diccionario local de estilos predefinidos para la escena
const SCENE_STYLES = {
  estudio: { bgColor: "#1e1e24", showGrid: true, showWireframe: false },
  laboratorio: { bgColor: "#f1f5f9", showGrid: true, showWireframe: true },
  minimal: { bgColor: "#0f172a", showGrid: false, showWireframe: false }
};

export default function Sidebar({
  fileName, error, setError, setBlobUrl, setModelExt, setFileName, prevBlob,
  showGrid, setShowGrid, showWireframe, setShowWireframe,
  bgColor, setBgColor, envPreset, setEnvPreset,
  uploading, setUploading, setShareUrl, 
  sceneStyle, setSceneStyle // Recibidos correctamente desde el Dashboard
}) {
  const inputRef = useRef(); // Referencia para controlar el input <type="file"> oculto
  const [cloudModels, setCloudModels] = useState([]); // Estado para listar los modelos guardados en la nube
  const [loadingModels, setLoadingModels] = useState(false); // Estado de carga para la galería cloud

  // ── EL EFECTO QUE SINCRONIZA EL ESTADO (Igual que hace Three con envPreset) ──
  useEffect(() => {
    const config = SCENE_STYLES[sceneStyle];
    if (!config) return; // Si es "custom", no sobrescribimos los cambios manuales del usuario

    setBgColor(config.bgColor);
    setShowGrid(config.showGrid);
    setShowWireframe(config.showWireframe);
  }, [sceneStyle, setBgColor, setShowGrid, setShowWireframe]);

  // Función asíncrona para traer los modelos existentes en el servidor
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

  // Hook de carga inicial de la galería remota al montar el componente
  useEffect(() => {
    fetchCloudModels();
  }, []);

  // Manejador central para archivos cargados por el usuario
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
        console.info("Modelo cargado localmente (+50MB, no guardado en la nube)");
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
      {/* SECCIÓN LOGO */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>VISION3D</span>
      </div>

      {/* CONTENEDOR DE SEGURIDAD INTERNO */}
      <div className={styles.scrollContainer}>
        
        {/* BLOQUE DE ARCHIVOS Y GALERÍA CLOUD */}
        <div className={styles.controlsSection}>
          <p className={styles.sectionLabel}>Carga de Modelos</p>
          <div className={styles.dropZone} onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current.click()}>
            <input ref={inputRef} type="file" accept=".glb,.gltf,.stl,.obj" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            <div className={styles.dropIcon}>⬆</div>
            <p className={styles.dropTitle}>Subir archivo 3D</p>
            <p className={styles.dropSub}>.glb · .gltf · .stl · .obj</p>
            {fileName && <p className={styles.dropFile}>✓ {fileName}</p>}
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

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

        {/* BLOQUE DE PARÁMETROS DE RENDER, ESCENAS E ILUMINACIÓN */}
        <div className={styles.controlsSection}>
          <p className={styles.sectionLabel}>Configuración Escena</p>

          <div className={styles.switchGroupMobile}>
            <label className={styles.controlRow}>
              <span>Rejilla</span>
              <button className={`${styles.toggle} ${showGrid ? styles.on : ""}`} onClick={() => setShowGrid(v => !v)}>
                <span className={styles.toggleKnob} />
              </button>
            </label>

            <label className={styles.controlRow}>
              <span>Malla</span>
              <button className={`${styles.toggle} ${showWireframe ? styles.on : ""}`} onClick={() => setShowWireframe(v => !v)}>
                <span className={styles.toggleKnob} />
              </button>
            </label>

            <label className={styles.controlRow}>
              <span>Color</span>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={styles.colorPick} />
            </label>
          </div>

          {/* Botones Estilo de Escena simplificados (Iguales a los ENV_PRESETS) */}
          <p className={`${styles.sectionLabel} ${styles.mtMd}`}>Estilo de Escena</p>
          <div className={styles.envGrid}>
            <button 
              className={`${styles.envBtn} ${sceneStyle === "estudio" ? styles.active : ""}`} 
              onClick={() => setSceneStyle("estudio")}
            >
              Estudio
            </button>
            <button 
              className={`${styles.envBtn} ${sceneStyle === "laboratorio" ? styles.active : ""}`} 
              onClick={() => setSceneStyle("laboratorio")}
            >
              Laboratorio
            </button>
            <button 
              className={`${styles.envBtn} ${sceneStyle === "minimal" ? styles.active : ""}`} 
              onClick={() => setSceneStyle("minimal")}
            >
              Minimal
            </button>
          </div>

          {/* Selector de iluminación */}
          <p className={`${styles.sectionLabel} ${styles.mtMd}`}>Iluminación del modelo</p>
          <div className={`${styles.envGrid} ${styles.lightingGrid}`}>
            {ENV_PRESETS.map((p) => (
              <button key={p} className={`${styles.envBtn} ${envPreset === p ? styles.active : ""}`} onClick={() => setEnvPreset(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

      </div>
      
      <div className={styles.footer}>
        <p>Clic · Rotar libre · Scroll zoom · Clic derecho · Pan</p>
      </div>
    </aside>
  );
}