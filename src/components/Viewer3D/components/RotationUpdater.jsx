import { useFrame } from "@react-three/fiber";

export default function RotationUpdater({ autoRotate, modelGroupRef }) {
  useFrame((state, delta) => {
    if (!autoRotate || !modelGroupRef.current) return;
    modelGroupRef.current.rotation.y += delta * 0.25; 
  });

  return null;
}