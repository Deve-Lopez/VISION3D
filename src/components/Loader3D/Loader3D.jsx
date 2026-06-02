import { Html, useProgress } from "@react-three/drei";
import styles from "./Loader3D.module.css";

export default function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className={styles.loader3d}>
        <div className={styles.spinner} />
        <div className={styles.loaderBar}>
          <div className={styles.loaderFill} style={{ width: `${progress}%` }} />
        </div>
        <span>Cargando modelo… {Math.round(progress)}%</span>
      </div>
    </Html>
  );
}