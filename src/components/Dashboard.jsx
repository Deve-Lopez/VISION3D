import { useState, useRef } from "react";
import Sidebar from "./Sidebar";
import Viewer3D from "./Viewer3D";

export default function Dashboard() {
  const [blobUrl, setBlobUrl]   = useState(null);
  const [modelExt, setModelExt] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [error, setError]       = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [envPreset, setEnvPreset] = useState("sunset");
  const [bgColor, setBgColor]   = useState("#0f172a");
  const prevBlob = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [shareUrl, setShareUrl]   = useState(null);

  return (
    <div className="app">
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
        bgColor={bgColor}
        setBgColor={setBgColor}
        envPreset={envPreset}
        setEnvPreset={setEnvPreset}
        uploading={uploading}
        setUploading={setUploading}
        setShareUrl={setShareUrl}
      />

      <Viewer3D 
        modelUrl={blobUrl}
        modelExt={modelExt}
        showGrid={showGrid}
        envPreset={envPreset}
        bgColor={bgColor}
      />
    </div>
  );
}