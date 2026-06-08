import { useState, useRef } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Viewer3D from "../Viewer3D/Viewer3D";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  // ── ESTADOS GLOBALES DE LA ESCENA ──
  const [blobUrl, setBlobUrl] = useState(null);
  const [modelExt, setModelExt] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);
  const prevBlob = useRef(null);

  // ── CONFIGURACIONES DE PARÁMETROS ──
  const [showGrid, setShowGrid] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [bgColor, setBgColor] = useState("#0b1120");
  const [envPreset, setEnvPreset] = useState("sunset");
  const [sceneStyle, setSceneStyle] = useState("estudio");

  // ── ESTADO PAR ALA AUTO-ROTACIÓN ──
  const [autoRotate, setAutoRotate] = useState(false);
  // ── ESTADOS DE SUBIDA (SUPABASE) ──
  const [uploading, setUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);

  return (
    <div className={styles.appDashboard}>
      <Sidebar
        fileName={fileName}
        error={error}
        setError={setError}
        setBlobUrl={setBlobUrl}
        setModelExt={setModelExt}
        setFileName={setFileName}
        prevBlob={prevBlob}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        showWireframe={showWireframe}
        setShowWireframe={setShowWireframe}
        bgColor={bgColor}
        setBgColor={setBgColor}
        sceneStyle={sceneStyle}
        setSceneStyle={setSceneStyle}
        envPreset={envPreset}
        setEnvPreset={setEnvPreset}
        uploading={uploading}
        setUploading={setUploading}
        setShareUrl={setShareUrl}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
      />
      
      <Viewer3D
        modelUrl={blobUrl}
        modelExt={modelExt}
        showGrid={showGrid}
        showWireframe={showWireframe}
        envPreset={envPreset}
        bgColor={bgColor}
        autoRotate={autoRotate}
      />
    </div>
  );
}