import { Html, useProgress } from "@react-three/drei";

export default function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader-3d">
        <div className="loader-bar">
          <div className="loader-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}