import { Html } from "@react-three/drei";
import styles from "../ModelLoader.module.css";

export default function LoadingOverlay() {
  return (
    <Html center>
      <div className={styles.loader3d}>
        <div className={styles.spinner} />
        <span>Cargando modelo…</span>
      </div>
    </Html>
  );
}