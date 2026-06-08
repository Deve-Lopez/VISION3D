// ModelLoader.jsx
import ModelGLTF from "./components/ModelGLTF";
import ModelSTL from "./components/ModelSTL";
import ModelOBJ from "./components/ModelOBJ";

export default function ModelLoader({ url, ext, onStats }) {
  if (ext === "stl") return <ModelSTL url={url} onStats={onStats} />;
  if (ext === "obj") return <ModelOBJ url={url} onStats={onStats} />;
  
  // Por defecto, tratamos el archivo como un estándar glTF/glb
  return <ModelGLTF url={url} onStats={onStats} />;
}