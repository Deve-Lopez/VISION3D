import { useFrame } from "@react-three/fiber";

export function RotationUpdater({ modelRef, autoRotate }) {
  useFrame((state, delta) => {
    // Si la rotación está activa y la referencia es segura, aplicamos delta-time
    if (autoRotate && modelRef && modelRef.current) {
      // 0.25 radianes por segundo asegura un movimiento elegante y predecible
      modelRef.current.rotation.y += delta * 0.25;
    }
  });

  return null;
}