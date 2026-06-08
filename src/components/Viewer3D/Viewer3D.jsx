// Viewer3D.jsx
import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import styles from "./Viewer3D.module.css";

export default function Viewer3D({ 
  modelUrl, modelExt, showGrid, showWireframe, envPreset, bgColor, autoRotate 
}) {
  const [stats, setStats] = useState(null);

  // Resetea las estadísticas cuando cambia el modelo
  useEffect(() => { setStats(null); }, [modelUrl]);

  return (
    <main className={styles.canvasWrap} style={{ backgroundColor: bgColor }}>
      
      {/* Empty State */}
      {!modelUrl && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◈</div>
          <p>Carga un modelo para empezar</p>
        </div>
      )}

      {/* Renderizador WebGL */}
{/* Renderizador WebGL */}
<Canvas 
  shadows 
  camera={{ position: [0, 1.5, 4], fov: 45 }}
  dpr={[1, 1.5]} // 👈 LIMITADOR: Capa la resolución máxima a 1.5x en móviles (vistas Retina/OLED pesadas)
  gl={{ 
    antialias: false,               // 👈 RENDIMIENTO: Apaga el suavizado de bordes (vital para mallas/wireframes)
    powerPreference: "high-performance", // 👈 HARDWARE: Fuerza al dispositivo a usar su gráfica dedicada/potente
    failIfMajorPerformanceCaveat: true  // 👈 SEGURIDAD: Evita cuelgues si el móvil no soporta aceleración estable
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
  />
</Canvas>
      {/* HUD de Estadísticas */}
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