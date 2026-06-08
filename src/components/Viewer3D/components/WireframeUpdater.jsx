import { useEffect, useRef } from "react";
import * as THREE from "three";

export function WireframeUpdater({ modelRef, showWireframe }) {
  const wireframeGroupRef = useRef(new THREE.Group());

  useEffect(() => {
    // 💡 PROTECCIÓN CRÍTICA: Si modelRef no existe o modelRef.current aún es null,
    // salimos pacíficamente sin romper la aplicación con un error fatal.
    if (!modelRef || !modelRef.current) return;

    const model = modelRef.current;
    const wireframeGroup = wireframeGroupRef.current;

    // 1. Si se desactiva el wireframe, limpiamos los restos y salimos
    if (!showWireframe) {
      while (wireframeGroup.children.length > 0) {
        const child = wireframeGroup.children.pop();
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
      if (wireframeGroup.parent) {
        model.remove(wireframeGroup);
      }
      return;
    }

    // 2. Si se activa, construimos una malla de bordes optimizada
    if (wireframeGroup.children.length === 0) {
      model.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const edgesGeo = new THREE.EdgesGeometry(child.geometry, 24);
          
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x6ee7b7,
            linewidth: 1,
          });

          const lineSegments = new THREE.LineSegments(edgesGeo, lineMaterial);
          
          lineSegments.position.copy(child.position);
          lineSegments.rotation.copy(child.rotation);
          lineSegments.scale.copy(child.scale);

          wireframeGroup.add(lineSegments);
        }
      });
    }

    // 3. Añadimos el grupo de líneas optimizadas al modelo principal
    model.add(wireframeGroup);

    return () => {
      while (wireframeGroup.children.length > 0) {
        const child = wireframeGroup.children.pop();
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
      if (model && wireframeGroup) model.remove(wireframeGroup);
    };
  }, [showWireframe, modelRef]);

  return null;
}