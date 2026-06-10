import { useState, useRef } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Viewer3D from "../Viewer3D/Viewer3D";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [blobUrl, setBlobUrl] = useState(null);
  const [modelExt, setModelExt] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);
  const prevBlob = useRef(null);

  const [showGrid, setShowGrid] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [bgColor, setBgColor] = useState("#0b1120");
  const [envPreset, setEnvPreset] = useState("sunset");
  const [sceneStyle, setSceneStyle] = useState("estudio");
  const [autoRotate, setAutoRotate] = useState(false);
  const [explodeStrength, setExplodeStrength] = useState(0); // 👈 0 = sin explotar

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
        explodeStrength={explodeStrength}
        setExplodeStrength={setExplodeStrength}
      />
      
      <Viewer3D
        modelUrl={blobUrl}
        modelExt={modelExt}
        showGrid={showGrid}
        showWireframe={showWireframe}
        envPreset={envPreset}
        bgColor={bgColor}
        autoRotate={autoRotate}
        explodeStrength={explodeStrength}
      />
    </div>
  );
}