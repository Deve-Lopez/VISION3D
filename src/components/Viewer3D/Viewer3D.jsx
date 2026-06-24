import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import styles from "./Viewer3D.module.css";

export default function Viewer3D({ 
  modelUrl, modelExt, showGrid, showWireframe, envPreset, bgColor, autoRotate
}) {
  const [stats, setStats] = useState(null);

  useEffect(() => { setStats(null); }, [modelUrl]);

  return (
    <main className={styles.canvasWrap} style={{ backgroundColor: bgColor }}>
      {!modelUrl && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◈</div>
          <p>Carga un modelo para empezar</p>
        </div>
      )}

      <Canvas 
        shadows 
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        dpr={[1, 1.5]} 
        gl={{ 
          antialias: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: true
        }}
      >
        <Scene
          modelUrl={modelUrl}
          modelExt={modelExt}
          showGrid={showGrid}
          showWireframe={showWireframe}
          envPreset={envPreset}
          onStats={setStats}
          autoRotate={autoRotate}
          bgColor={bgColor}
        />
      </Canvas>

      {stats && (
        <div className={styles.statsHud}>
          <span className={styles.statsCount}>▲ {stats.polygons}</span> polígonos
          <br />
          <span className={styles.statsCount}>● {stats.vertices}</span> vértices
        </div>
      )}
    </main>
  );
}