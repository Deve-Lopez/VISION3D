import { useRef } from "react";
import { uploadToStorage } from "../../../storage";
import { VALID_EXT } from "../constants";
import styles from "../Sidebar.module.css";

export default function DropZone3D({ 
  fileName, setFileName, setBlobUrl, setModelExt, setError, prevBlob, uploading, setUploading, setShareUrl, onUploadSuccess 
}) {
  const inputRef = useRef();

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
        onUploadSuccess();
      }
    } catch (e) {
      console.error("Error en backup silencioso:", e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div 
      className={styles.dropZone} 
      onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} 
      onDragOver={(e) => e.preventDefault()} 
      onClick={() => inputRef.current.click()}
    >
      <input ref={inputRef} type="file" accept=".glb,.gltf,.stl,.obj" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
      <div className={styles.dropIcon}>⬆</div>
      <p className={styles.dropTitle}>Subir archivo 3D</p>
      <p className={styles.dropSub}>.glb · .gltf · .stl · .obj</p>
      {fileName && <p className={styles.dropFile}>✓ {fileName}</p>}
    </div>
  );
}