import { forwardRef } from "react";
import ModelGLTF from "./components/ModelGLTF";
import ModelSTL from "./components/ModelSTL";
import ModelOBJ from "./components/ModelOBJ";

const ModelLoader = forwardRef(function ModelLoader(
  { url, ext, onStats, showWireframe, explodeStrength },
  groupRef
) {
  if (ext === "stl") {
    return (
      <ModelSTL
        ref={groupRef}
        url={url}
        onStats={onStats}
        showWireframe={showWireframe}
        explodeStrength={explodeStrength}
      />
    );
  }
  if (ext === "obj") {
    return (
      <ModelOBJ
        ref={groupRef}
        url={url}
        onStats={onStats}
        showWireframe={showWireframe}
        explodeStrength={explodeStrength}
      />
    );
  }
  return (
    <ModelGLTF
      ref={groupRef}
      url={url}
      onStats={onStats}
      showWireframe={showWireframe}
      explodeStrength={explodeStrength}
    />
  );
});

export default ModelLoader;