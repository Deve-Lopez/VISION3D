import { useEffect, useRef } from "react";
import * as THREE from "three";

export function WireframeUpdater({ modelRef, showWireframe }) {
  const wireframeGroupRef = useRef(new THREE.Group());

  useEffect(() => {
    if (!modelRef.current) return;

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

    // 2. Si se activa, construimos una malla de bordes optimizada (EdgesGeometry)
    // Evitamos duplicar si ya existe
    if (wireframeGroup.children.length === 0) {
      model.traverse((child) => {
        if (child.isMesh && child.geometry) {
          // EdgesGeometry solo calcula las líneas de los contornos reales,
          // ignorando diagonales invisibles. ¡Reduce los vectores un 70%!
          const edgesGeo = new THREE.EdgesGeometry(child.geometry, 24); // 24 grados de umbral
          
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x6ee7b7, // Tu color accent habitual
            linewidth: 1,    // Grosor mínimo nativo
          });

          const lineSegments = new THREE.LineSegments(edgesGeo, lineMaterial);
          
          // Copiamos escala y posición exacta del sub-mesh
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
      // Limpieza al desmontar
      while (wireframeGroup.children.length > 0) {
        const child = wireframeGroup.children.pop();
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
      model.remove(wireframeGroup);
    };
  }, [showWireframe, modelRef]);

  return null;
}