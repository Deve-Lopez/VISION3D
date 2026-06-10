import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Wireframe profesional usando EdgesGeometry.
 * Solo dibuja las aristas reales del modelo, sin ruido de triangulación.
 */
export function WireframeUpdater({ modelRef, showWireframe }) {
  const edgeMeshesRef = useRef([]);

  useEffect(() => {
    if (!modelRef?.current) return;

    const model = modelRef.current;

    // Limpieza
    const cleanup = () => {
      edgeMeshesRef.current.forEach(({ parent, line }) => {
        parent.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      });
      edgeMeshesRef.current = [];
    };

    if (!showWireframe) {
      cleanup();
      return;
    }

    // Crear aristas para cada mesh del modelo
    model.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;

      const edges = new THREE.EdgesGeometry(child.geometry, 15); // 15° = umbral de ángulo entre caras
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: "#94a3b8", // gris azulado, elegante
          transparent: true,
          opacity: 0.85,
          depthTest: true,
        })
      );

      // Lo añadimos como hijo del mismo mesh para que herede posición/rotación/escala
      line.raycast = () => {}; // no interfiere con los clicks del usuario
      child.add(line);
      edgeMeshesRef.current.push({ parent: child, line });
    });

    return cleanup;
  }, [showWireframe, modelRef]);

  return null;
}