import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Componente optimizado para aplicar una malla transparente
 * tipo "Rayos X" en color gris oscuro técnico e independiente.
 */
export function WireframeUpdater({ modelRef, showWireframe }) {
  // Guardamos un historial de los materiales originales para restaurarlos al apagar la malla
  const originalMaterialsRef = useRef(new Map());

  useEffect(() => {
    // Protección anti-cuelgues si el modelo aún no se ha cargado
    if (!modelRef || !modelRef.current) return;

    const model = modelRef.current;
    const materialsMap = originalMaterialsRef.current;

    // 1. Si desactivas el interruptor "Malla", restauramos los materiales originales
    if (!showWireframe) {
      if (materialsMap.size > 0) {
        model.traverse((child) => {
          if (child.isMesh && materialsMap.has(child.uuid)) {
            const originalMat = materialsMap.get(child.uuid);
            
            if (Array.isArray(originalMat)) {
              child.material = originalMat;
            } else {
              child.material.dispose(); // Liberamos el material wireframe
              child.material = originalMat; // Reasignamos el original limpio
            }
          }
        });
        materialsMap.clear();
      }
      return;
    }

    // 2. Aplicamos la malla transparente en gris oscuro
    if (materialsMap.size === 0) {
      model.traverse((child) => {
        if (child.isMesh && child.geometry) {
          // Respaldamos el material original
          materialsMap.set(child.uuid, child.material);

          // Creamos el material transparente con estética industrial/técnica gris
          child.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color("#475569"), // 👈 GRIS OSCURO FIJO (Independiente del fondo)
            wireframe: true,
            transparent: true,
            opacity: 0.18,           // Opacidad equilibrada para que sea visible y transparente
            depthTest: true,
            side: THREE.DoubleSide,  // Muestra las líneas internas y externas
          });
        }
      });
    }

    // 3. Limpieza de seguridad al desmontar el componente (Ctrl+S, cambios de ruta, etc.)
    return () => {
      if (model && materialsMap.size > 0) {
        model.traverse((child) => {
          if (child.isMesh && materialsMap.has(child.uuid)) {
            const originalMat = materialsMap.get(child.uuid);
            if (!Array.isArray(originalMat)) {
              if (child.material) child.material.dispose();
            }
            child.material = originalMat;
          }
        });
        materialsMap.clear();
      }
    };
  }, [showWireframe, modelRef]); // Ya no depende de colores externos, evitando parpadeos

  return null;
}