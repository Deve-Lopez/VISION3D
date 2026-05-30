import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, Environment } from "@react-three/drei";
import { TrackballControls } from "three-stdlib";
import ModelLoader from "./ModelLoader";
import Loader3D from "./Loader3D";

function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    const controls = new TrackballControls(camera, gl.domElement);
    controls.rotateSpeed = 3.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.2;
    controlsRef.current = controls;

    const animate = () => {
      controls.update();
    };

    // Eventos del mouse
    gl.domElement.addEventListener("mousemove", animate);
    gl.domElement.addEventListener("mousedown", animate);
    gl.domElement.addEventListener("wheel", animate);

    // Eventos del touch (móvil)
    gl.domElement.addEventListener("touchstart", animate, { passive: false});
    gl.domElement.addEventListener("touchmove", animate, { passive: false});
    gl.domElement.addEventListener("touchend", animate);

    return () => {
      controls.dispose();
      gl.domElement.removeEventListener("mousemove", animate);
      gl.domElement.removeEventListener("mousedown", animate);
      gl.domElement.removeEventListener("wheel", animate);
      gl.domElement.removeEventListener("touchstart", animate);
      gl.domElement.removeEventListener("touchmove", animate);
      gl.domElement.removeEventListener("touchend", animate);

    };
  }, [camera, gl]);

  return null;
}

function Scene({ modelUrl, modelExt, showGrid, envPreset }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      <Environment preset={envPreset} />
      {showGrid && (
        <Grid infiniteGrid cellSize={0.5} cellThickness={0.5}
          sectionSize={3} sectionThickness={1} fadeDistance={30}
          cellColor="#334155" sectionColor="#475569" />
      )}
      <Suspense fallback={<Loader3D />}>
        {modelUrl && <ModelLoader url={modelUrl} ext={modelExt} />}
      </Suspense>
      <Controls />
    </>
  );
}

export default function Viewer3D({ modelUrl, modelExt, showGrid, envPreset, bgColor }) {
  return (
    <main className="canvas-wrap" style={{ background: bgColor }}>
      {!modelUrl && (
        <div className="empty-state">
          <div className="empty-state-card">
            <div className="empty-icon">◈</div>
            <p>Carga un modelo para empezar</p>
          </div>
        </div>
      )}
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        style={{ width: "100%", height: "100%", cursor: "grab" }}
      >
        <Scene modelUrl={modelUrl} modelExt={modelExt} showGrid={showGrid} envPreset={envPreset} />
      </Canvas>
    </main>
  );
}