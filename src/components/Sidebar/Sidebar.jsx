// Sidebar.jsx
import { useState, useEffect } from "react";
import { listModelsFromStorage } from "../../storage";
import { SCENE_STYLES } from "./constants";
import styles from "./Sidebar.module.css";

// Importación de submódulos atómicos
import DropZone3D from "./components/DropZone3D";
import CloudGallery from "./components/CloudGallery";
import SceneConfigControls from "./components/SceneConfigControls";
import SceneStyleSelector from "./components/SceneStyleSelector";

export default function Sidebar({
  fileName, error, setError, setBlobUrl, setModelExt, setFileName, prevBlob,
  showGrid, setShowGrid, showWireframe, setShowWireframe,
  bgColor, setBgColor, envPreset, setEnvPreset,
  uploading, setUploading, setShareUrl,
  sceneStyle, setSceneStyle, autoRotate, setAutoRotate
}) {
  const [cloudModels, setCloudModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Sincronización del preset global de estilos de escena
  useEffect(() => {
    const config = SCENE_STYLES[sceneStyle];
    if (!config) return;

    setBgColor(config.bgColor);
    setShowGrid(config.showGrid);
    setShowWireframe(config.showWireframe);
  }, [sceneStyle, setBgColor, setShowGrid, setShowWireframe]);

  // Petición a la infraestructura del servidor
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

  useEffect(() => { fetchCloudModels(); }, []);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>VISION3D</span>
      </div>

      <div className={styles.scrollContainer}>
        {/* BLOQUE DE ARCHIVOS */}
        <div className={styles.controlsSection}>
          <p className={styles.sectionLabel}>Carga de Modelos</p>
          <DropZone3D
            fileName={fileName} setFileName={setFileName}
            setBlobUrl={setBlobUrl} setModelExt={setModelExt}
            setError={setError} prevBlob={prevBlob}
            uploading={uploading} setUploading={setUploading}
            setShareUrl={setShareUrl} onUploadSuccess={fetchCloudModels}
          />
          {error && <p className={styles.errorMsg}>{error}</p>}

          <p className={styles.sectionLabel}>Modelos en la nube</p>
          <CloudGallery
            cloudModels={cloudModels} loadingModels={loadingModels}
            fileName={fileName} setFileName={setFileName}
            setBlobUrl={setBlobUrl} setModelExt={setModelExt}
            setError={setError} prevBlob={prevBlob}
          />
        </div>

        {/* BLOQUE DE PARÁMETROS DE RENDER */}
        <div className={styles.controlsSection}>
          <p className={styles.sectionLabel}>Configuración Escena</p>
          <SceneConfigControls
            showGrid={showGrid} setShowGrid={setShowGrid}
            showWireframe={showWireframe} setShowWireframe={setShowWireframe}
            autoRotate={autoRotate} setAutoRotate={setAutoRotate}
            bgColor={bgColor} setBgColor={setBgColor}
          />
          <SceneStyleSelector
            sceneStyle={sceneStyle} setSceneStyle={setSceneStyle}
            envPreset={envPreset} setEnvPreset={setEnvPreset}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <p>Clic · Rotar libre · Scroll zoom · Clic derecho · Pan</p>
      </div>
    </aside>
  );
}