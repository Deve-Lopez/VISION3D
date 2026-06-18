import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function CameraFitter({ modelUrl, targetRef }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!modelUrl) return;

    // 1. HARD RESET AGRESIVO: Si la cámara o los controles se rompieron con NaN,
    // los devolvemos a mano a una posición inicial segura en el espacio.
    camera.position.set(5, 5, 5);
    camera.near = 0.1;
    camera.far = 1000;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.set(0, 0, 0);
      // Reseteamos cualquier bloqueo interno del OrbitControls
      controls.reset(); 
      controls.update();
    }

    // 2. Esperamos a que React termine de procesar el render del nuevo modelo
    const timeoutId = setTimeout(() => {
      const group = targetRef?.current;
      if (!group) return;

      // Aseguramos que las mallas existan
      let hasMesh = false;
      group.traverse((o) => { if (o.isMesh) hasMesh = true; });
      if (!hasMesh) return;

      // Force-update de matrices en el motor gráfico
      group.updateMatrixWorld(true);

      // 3. Calculamos la caja contenedora
      const box = new THREE.Box3().setFromObject(group);
      
      // Si la caja da valores infinitos o inválidos, usamos una por defecto para no romper la app
      if (box.isEmpty() || isNaN(box.min.x)) {
        console.warn("Caja contenedora inválida o vacía temporalmente.");
        return;
      }

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // 4. Distancia con margen de seguridad
      const fov = camera.fov * (Math.PI / 180);
      let distance = (maxDim / 2) / Math.tan(fov / 2) * 2.2;
      
      // Evitar distancias ridículamente pequeñas que causen bugs de escala
      if (distance < 1) distance = 2.5; 

      const direction = new THREE.Vector3(1, 0.5, 1).normalize();
      
      // 5. Aplicar posiciones absolutas y limpias de NaN
      const targetPosition = new THREE.Vector3()
        .copy(center)
        .addScaledVector(direction, distance);

      // Validamos que los números sean reales antes de inyectarlos a la cámara
      if (!isNaN(targetPosition.x) && !isNaN(center.x)) {
        camera.position.copy(targetPosition);

        if (controls) {
          controls.target.copy(center);
          controls.update();
        } else {
          camera.lookAt(center);
        }
      }

      camera.updateProjectionMatrix();
    }, 100); // Subimos a 100ms para asegurar que el cambio de estado de React haya concluido por completo

    return () => clearTimeout(timeoutId);
  }, [modelUrl, targetRef, camera, controls]);

  return null;
}