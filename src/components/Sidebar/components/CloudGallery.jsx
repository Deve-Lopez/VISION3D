import styles from "../Sidebar.module.css";

export default function CloudGallery({ cloudModels, loadingModels, fileName, setFileName, setBlobUrl, setModelExt, setError, prevBlob }) {
  
  function handleSelectCloudModel(model) {
    if (prevBlob.current) {
      URL.revokeObjectURL(prevBlob.current);
      prevBlob.current = null;
    }
    setError(null);
    setBlobUrl(model.url);
    setModelExt(model.ext);
    setFileName(model.name);
  }

  if (loadingModels) return <p className={styles.dropSub}>Conectando con la nube...</p>;
  if (cloudModels.length === 0) return <p className={styles.dropSub}>No hay modelos guardados.</p>;

  return (
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
  );
}