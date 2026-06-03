import { useRef, useState, useEffect } from "react";
// Importamos funciones externas para interactuar con Firebase o el almacenamiento en la nube
import { uploadToStorage, listModelsFromStorage } from "../../storage";
// Importamos el objeto de estilos locales protegidos (CSS Modules)
import styles from "./Sidebar.module.css";

// Lista estática de nombres limpios para los botones de entorno de iluminación
const ENV_PRESETS = ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "lobby"];
// Extensiones de archivos 3D permitidas por el cargador de la app
const VALID_EXT = ["glb", "gltf", "stl", "obj"];

// ── DEFINIMOS EL OBJETO DE CONFIGURACIONES AQUÍ ADENTRO ──
const SCENE_STYLES = {
  estudio: { bgColor: "#1e1e24", showGrid: true, showWireframe: false },
  laboratorio: { bgColor: "#f1f5f9", showGrid: true, showWireframe: true },
  minimal: { bgColor: "#0f172a", showGrid: false, showWireframe: false }
};

export default function Sidebar({
  fileName, error, setError, setBlobUrl, setModelExt, setFileName, prevBlob,
  showGrid, setShowGrid, showWireframe, setShowWireframe,
  bgColor, setBgColor, envPreset, setEnvPreset,
  uploading, setUploading, setShareUrl
  // ── CORRECCIÓN: Eliminamos 'onCambiarEstiloEscena' de aquí ya que no viene del Dashboard ──
}) {
  const inputRef = useRef(); // Referencia para controlar el input <type="file"> oculto
  const [cloudModels, setCloudModels] = useState([]); // Estado para listar los modelos guardados en la nube
  const [loadingModels, setLoadingModels] = useState(false); // Estado de carga para la galería cloud

  // ── FUNCIÓN MANEJADORA INTERNA ──
  function manejarCambioEstilo(estiloKey) {
    const config = SCENE_STYLES[estiloKey];
    if (!config) return;

    // Ejecutamos los setters que vienen por props directamente
    setBgColor(config.bgColor);
    setShowGrid(config.showGrid);
    setShowWireframe(config.showWireframe);
  }

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

  // Hook que se ejecuta una sola vez al montar el componente para poblar la lista de la nube
  useEffect(() => {
    fetchCloudModels();
  }, []);

  // Manejador central para archivos cargados por el usuario (vía clic o arrastre)
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

  // Captura el archivo cuando el usuario lo suelta en la dropzone
  function onDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  // Maneja el clic en un modelo que ya existe en la base de datos remota
  function handleSelectCloudModel(model) {
    setError(null);
    setBlobUrl(model.url);
    setModelExt(model.ext);
    setFileName(model.name);
  }

  return (
    <aside className={styles.sidebar}>
      {/* Sección del logotipo de la aplicación */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>VISION3D</span>
      </div>

      {/* Zona de arrastre e importación de archivos de usuario */}
      <div className={styles.dropZone} onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" accept=".glb,.gltf,.stl,.obj" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        <div className={styles.dropIcon}>⬆</div>
        <p className={styles.dropTitle}>Arrastra tu modelo</p>
        <p className={styles.dropSub}>.glb · .gltf · .stl · .obj</p>
        {fileName && <p className={styles.dropFile}>✓ {fileName}</p>}
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* SECCIÓN: Galería de modelos guardados en la nube */}
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

      {/* SECCIÓN CONTROLES: Parámetros gráficos del renderizador */}
      <div className={`${styles.controlsSection} ${styles.mtMd}`}>
        <p className={styles.sectionLabel}>Escena</p>

        {/* Interruptor para la cuadrícula del suelo de la escena */}
        <label className={styles.controlRow}>
          <span>Cuadrícula</span>
          <button className={`${styles.toggle} ${showGrid ? styles.on : ""}`} onClick={() => setShowGrid(v => !v)}>
            <span className={styles.toggleKnob} />
          </button>
        </label>

        {/* Interruptor para activar la vista de mallas (Wireframe) del objeto 3D */}
        <label className={styles.controlRow}>
          <span>Malla</span>
          <button className={`${styles.toggle} ${showWireframe ? styles.on : ""}`} onClick={() => setShowWireframe(v => !v)}>
            <span className={styles.toggleKnob} />
          </button>
        </label>

        {/* Selector de color nativo de HTML para el fondo del Canvas */}
        <label className={styles.controlRow}>
          <span>Fondo</span>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={styles.colorPick} />
        </label>

        {/* ── SECCIÓN MODIFICADA: Ahora apunta correctamente a 'manejarCambioEstilo' ── */}
        <p className={`${styles.sectionLabel} ${styles.mtMd}`}>Estilo de Escena</p>
        <div className={styles.envGrid}>
          <button
            className={`${styles.envBtn} ${bgColor === "#1e1e24" && showGrid && !showWireframe ? styles.active : ""}`}
            onClick={() => manejarCambioEstilo("estudio")}
          >
            Estudio
          </button>

          <button
            className={`${styles.envBtn} ${bgColor === "#f1f5f9" && showGrid && showWireframe ? styles.active : ""}`}
            onClick={() => manejarCambioEstilo("laboratorio")}
          >
            Laboratorio
          </button>

          <button
            className={`${styles.envBtn} ${bgColor === "#0f172a" && !showGrid && !showWireframe ? styles.active : ""}`}
            onClick={() => manejarCambioEstilo("minimal")}
          >
            Minimal
          </button>
        </div>

        {/* SECCIÓN CONTROLES: Preajustes de iluminación */}
        <p className={`${styles.sectionLabel} ${styles.mtMd}`}>Iluminación del modelo</p>
        <div className={styles.envGrid}>
          {ENV_PRESETS.map((p) => (
            <button key={p} className={`${styles.envBtn} ${envPreset === p ? styles.active : ""}`} onClick={() => setEnvPreset(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Pequeña guía interactiva fija al fondo de la Sidebar */}
      <div className={styles.footer}>
        <p>Clic · Rotar libre · Scroll zoom · Clic derecho · Pan</p>
      </div>
    </aside>
  );
}