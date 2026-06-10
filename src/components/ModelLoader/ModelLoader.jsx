import ModelGLTF from "./components/ModelGLTF";
import ModelSTL from "./components/ModelSTL";
import ModelOBJ from "./components/ModelOBJ";

export default function ModelLoader({ url, ext, onStats, showWireframe, explodeStrength }) {
  if (ext === "stl") return <ModelSTL url={url} onStats={onStats} showWireframe={showWireframe} explodeStrength={explodeStrength} />;
  if (ext === "obj") return <ModelOBJ url={url} onStats={onStats} showWireframe={showWireframe} explodeStrength={explodeStrength} />;
  return <ModelGLTF url={url} onStats={onStats} showWireframe={showWireframe} explodeStrength={explodeStrength} />;
}