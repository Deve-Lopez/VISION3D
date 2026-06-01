import { Suspense, useEffect, useRef, useState, memo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Grid, Environment } from "@react-three/drei";
import { TrackballControls } from "three-stdlib";
import ModelLoader from "./ModelLoader";
import Loader3D from "./Loader3D";

// ── COMPONENTE: CONTROLES DE CÁMARA OPTIMIZADOS ──
function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    // Detectamos si es un dispositivo táctil para suavizar la velocidad
    const isTouchDevice = window.matchMedia("(pointer:coarse)").matches;
    
    const controls = new TrackballControls(camera, gl.domElement);
    controls.rotateSpeed = isTouchDevice ? 2.2 : 3.0;
    controls.zoomSpeed = isTouchDevice ? 0.6 : 1.2;
    controls.panSpeed = isTouchDevice ? 0.6 : 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.2;

    // Parche de seguridad: Evita que la cámara se quede girando infinitamente
    // si el usuario suelta el clic fuera del área del Canvas.
    const handleMouseUp = () => controls.handleMouseUp?.();
    window.addEventListener("mouseup", handleMouseUp);
    
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [camera, gl]);

  // useFrame ejecuta la actualización de forma nativa en el ciclo de la GPU (60/120 fps)
  useFrame(() => controlsRef.current?.update());
  
  return null;
}

// ── COMPONENTE: MODIFICADOR DE ALAMBRE (WIREFRAME) ──
function WireframeUpdater({ showWireframe }) {
  const { scene } = useThree();
  
  useEffect(() => {
    // Recorremos todos los elementos del escenario
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Soportamos tanto materiales únicos como arreglos de materiales (multimat)
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => { 
          mat.wireframe = showWireframe; 
        });
      }
    });
  }, [showWireframe, scene]);
  
  return null;
}

// ── COMPONENTE: ESCENA INTERNA DEL CANVAS (MEMOIZADA) ──
const Scene = memo(function Scene({ modelUrl, modelExt, showGrid, envPreset, onStats, showWireframe }) {
  return (
    <>
      {/* Iluminación base de la escena */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      
      {/* Mapeo de entorno HDRI */}
      <Environment preset={envPreset} />
      
      {/* Cuadrícula infinita de apoyo */}
      {showGrid && (
        <Grid
          infiniteGrid
          cellSize={0.5}
          cellThickness={0.5}
          sectionSize={3}
          sectionThickness={1}
          fadeDistance={30}
          cellColor="#334155"
          sectionColor="#475569"
        />
      )}

      {/* Carga del modelo con fallback de carga global */}
      <Suspense fallback={<Loader3D />}>
        {modelUrl && (
          <ModelLoader 
            url={modelUrl} 
            ext={modelExt} 
            onStats={onStats} 
            showWireframe={showWireframe} 
          />
        )}
      </Suspense>

      {/* Inyecciones de comportamiento en tiempo de ejecución */}
      <WireframeUpdater showWireframe={showWireframe} />
      <Controls />
    </>
  );
});

// ── EXPORTACIÓN PRINCIPAL DEL VISOR ──
export default function Viewer3D({ modelUrl, modelExt, showGrid, showWireframe, envPreset, bgColor }) {
  const [stats, setStats] = useState(null);

  // Cada vez que el usuario cambie de modelo, reseteamos las estadísticas para que no muestre datos viejos
  useEffect(() => {
    setStats(null);
  }, [modelUrl]);

  return (
    <main className="canvas-wrap" style={{ background: bgColor }}>
      {/* Pantalla de bienvenida / Estado vacío */}
      {!modelUrl && (
        <div className="empty-state">
          <div className="empty-state-card">
            <div className="empty-icon">◈</div>
            <p>Carga un modelo para empezar</p>
          </div>
        </div>
      )}

      {/* Contenedor principal de Three.js */}
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        style={{ width: "100%", height: "100%", cursor: "grab" }}
      >
        <Scene
          modelUrl={modelUrl}
          modelExt={modelExt}
          showGrid={showGrid}
          showWireframe={showWireframe}
          envPreset={envPreset}
          onStats={setStats}
        />
      </Canvas>

      {/* Cartelera flotante de información técnica */}
      {stats && (
        <div style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "8px 14px",
          fontSize: "11px",
          color: "#94a3b8",
          lineHeight: "1.8",
          pointerEvents: "none",
          zIndex: 10
        }}>
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>▲ {stats.polygons}</span> polígonos
          <br />
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>● {stats.vertices}</span> vértices
        </div>
      )}
    </main>
  );
}