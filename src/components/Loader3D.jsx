import { Html, useProgress } from "@react-three/drei";

export default function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader-3d">
        <div className="spinner" style={{ width: 28, height: 28, marginBottom: 4 }} />
        <div className="loader-bar" style={{ width: 120 }}>
          <div className="loader-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>Cargando modelo… {Math.round(progress)}%</span>
      </div>
    </Html>
  );
}