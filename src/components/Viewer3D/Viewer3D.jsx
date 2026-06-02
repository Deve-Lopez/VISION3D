import { Suspense, useEffect, useRef, useState, memo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Grid, Environment } from "@react-three/drei";
import { TrackballControls } from "three-stdlib";
import * as THREE from "three";

// ── CORRECCIÓN DE RUTAS SEGÚN TU EXPLORADOR ──
// ── CAMBIA ESTAS LÍNEAS EN Viewer3D.jsx ──
import ModelLoader from "../ModelLoader/ModelLoader";
import Loader3D from "../Loader3D/Loader3D";
import styles from "./Viewer3D.module.css";
function CameraFitter({ modelUrl }) {
  const { camera, scene } = useThree();
  const fitted = useRef(null);

  useEffect(() => { fitted.current = null; }, [modelUrl]);

  useFrame(() => {
    if (!modelUrl || fitted.current === modelUrl) return;

    let hasMesh = false;
    scene.traverse((o) => { if (o.isMesh) hasMesh = true; });
    if (!hasMesh) return;

    const box = new THREE.Box3();
    scene.traverse((o) => { if (o.isMesh) box.expandByObject(o); });
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 2.5;

    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.lookAt(center);

    camera.near = distance * 0.01;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    fitted.current = modelUrl;
  });

  return null;
}

function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer:coarse)").matches;
    const controls = new TrackballControls(camera, gl.domElement);
    controls.rotateSpeed = isTouchDevice ? 2.2 : 3.0;
    controls.zoomSpeed = isTouchDevice ? 0.6 : 1.2;
    controls.panSpeed = isTouchDevice ? 0.6 : 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.2;

    const handleMouseUp = () => controls.handleMouseUp?.();
    window.addEventListener("mouseup", handleMouseUp);

    controlsRef.current = controls;
    return () => {
      controls.dispose();
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [camera, gl]);

  useFrame(() => controlsRef.current?.update());

  return null;
}

function WireframeUpdater({ showWireframe, modelGroupRef }) {
  useFrame(() => {
    // Si el modelo no se ha cargado todavía, salimos
    if (!modelGroupRef.current) return;

    // Recorremos SOLO los objetos que están dentro del contenedor del modelo
    modelGroupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (mat.wireframe !== showWireframe) {
            mat.wireframe = showWireframe;
          }
        });
      }
    });
  });

  return null;
}

const Scene = memo(function Scene({ modelUrl, modelExt, showGrid, envPreset, onStats, showWireframe }) {
  // 1. Creamos la referencia exclusiva para el modelo
  const modelGroupRef = useRef();

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      <Environment preset={envPreset} />

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

      {/* 2. Envolvemos el cargador en un grupo con nuestra referencia */}
      <group ref={modelGroupRef}>
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
      </group>

      {/* 3. Le pasamos la referencia al actualizador de la malla */}
      <WireframeUpdater showWireframe={showWireframe} modelGroupRef={modelGroupRef} />

      <CameraFitter modelUrl={modelUrl} />
      <Controls />
    </>
  );
});

export default function Viewer3D({ modelUrl, modelExt, showGrid, showWireframe, envPreset, bgColor }) {
  const [stats, setStats] = useState(null);

  useEffect(() => { setStats(null); }, [modelUrl]);

  return (
    /* El background dinámico se queda inline porque cambia con el color picker en tiempo real */
    <main className={styles.canvasWrap} style={{ backgroundColor: bgColor }}>
      {!modelUrl && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◈</div>
          <p>Carga un modelo para empezar</p>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }}>
        <Scene
          modelUrl={modelUrl}
          modelExt={modelExt}
          showGrid={showGrid}
          showWireframe={showWireframe}
          envPreset={envPreset}
          onStats={setStats}
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