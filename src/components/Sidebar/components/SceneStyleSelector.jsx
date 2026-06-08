import { ENV_PRESETS } from "../constants";
import styles from "../Sidebar.module.css";

export default function SceneStyleSelector({ sceneStyle, setSceneStyle, envPreset, setEnvPreset }) {
  return (
    <>
      <p className={`${styles.sectionLabel} ${styles.mtMd}`}>Estilo de Escena</p>
      <div className={styles.envGrid}>
        {["estudio", "laboratorio", "minimal"].map((style) => (
          <button
            key={style}
            className={`${styles.envBtn} ${sceneStyle === style ? styles.active : ""}`}
            onClick={() => setSceneStyle(style)}
          >
            {style.charAt(0).toUpperCase() + style.slice(1)}
          </button>
        ))}
      </div>

      <p className={`${styles.sectionLabel} ${styles.mtMd}`}>Iluminación del modelo</p>
      <div className={`${styles.envGrid} ${styles.lightingGrid}`}>
        {ENV_PRESETS.map((p) => (
          <button key={p} className={`${styles.envBtn} ${envPreset === p ? styles.active : ""}`} onClick={() => setEnvPreset(p)}>
            {p}
          </button>
        ))}
      </div>
    </>
  );
}