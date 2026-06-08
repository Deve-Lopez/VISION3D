import { useFrame } from "@react-three/fiber";

export function RotationUpdater({ modelRef, autoRotate }) {
  useFrame((state, delta) => {
    // Multiplicar por delta garantiza que el giro se mueva a la misma velocidad real
    // independientemente de si el móvil corre a 60 FPS o sufre a 25 FPS,
    // eliminando la sensación de "tirón desagradable".
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.25; // 0.25 rad/s (giro suave y constante)
    }
  });

  return null;
}