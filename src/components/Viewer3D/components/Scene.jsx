import { Suspense, useRef, memo } from "react";
import { Grid, Environment } from "@react-three/drei";
import ModelLoader from "../../ModelLoader/ModelLoader";
import Loader3D from "../../Loader3D/Loader3D";
import { LOCAL_ENV_FILES } from "../constants";

import { RotationUpdater } from "./RotationUpdater";
import CameraFitter from "./CameraFitter";
import Controls from "./Controls";

export const Scene = memo(function Scene({ 
  modelUrl, modelExt, showGrid, envPreset, onStats, showWireframe, autoRotate, bgColor, explodeStrength
}) {
  const modelGroupRef = useRef();
  const envFile = LOCAL_ENV_FILES[envPreset] || LOCAL_ENV_FILES.sunset;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      
      <Suspense fallback={null}>
        {envFile && <Environment key={envPreset} files={envFile} />}
      </Suspense>

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

      <group ref={modelGroupRef}>
        <Suspense fallback={<Loader3D />}>
          {modelUrl && (
            <ModelLoader
              url={modelUrl}
              ext={modelExt}
              onStats={onStats}
              showWireframe={showWireframe}
              explodeStrength={explodeStrength}
            />
          )}
        </Suspense>
      </group>

      <RotationUpdater autoRotate={autoRotate} modelRef={modelGroupRef} />
      <CameraFitter modelUrl={modelUrl} />
      <Controls />
    </>
  );
});