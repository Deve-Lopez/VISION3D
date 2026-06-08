import { useFrame } from "@react-three/fiber";

export default function WireframeUpdater({ showWireframe, modelGroupRef }) {
  useFrame(() => {
    if (!modelGroupRef.current) return;

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