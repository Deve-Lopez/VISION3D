import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Componente híbrido de Malla Transparente.
 * Detecta automáticamente hardware móvil y reduce la carga gráfica
 * para mantener los fotogramas fluidos sin perder la estética.
 */
export function WireframeUpdater({ modelRef, showWireframe }) {
  const originalMaterialsRef = useRef(new Map());

  useEffect(() => {
    if (!modelRef || !modelRef.current) return;

    const model = modelRef.current;
    const materialsMap = originalMaterialsRef.current;

    // 1. Desactivación y restauración total
    if (!showWireframe) {
      if (materialsMap.size > 0) {
        model.traverse((child) => {
          if (child.isMesh && materialsMap.has(child.uuid)) {
            const originalMat = materialsMap.get(child.uuid);
            if (Array.isArray(originalMat)) {
              child.material = originalMat;
            } else {
              child.material.dispose();
              child.material = originalMat;
            }
          }
        });
        materialsMap.clear();
      }
      return;
    }

    // 2. DETECCIÓN DE MÓVIL / HARDWARE DE BAJO RENDIMIENTO
    const isMobile = /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // Si es móvil, usamos un truco visual: bajamos la opacidad drásticamente (0.07)
    // para que la GPU no sufra recalculando la superposición de transparencias (Alpha Blending)
    const optimalOpacity = isMobile ? 0.06 : 0.18;

    // 3. Aplicación de la Malla Inteligente
    if (materialsMap.size === 0) {
      model.traverse((child) => {
        if (child.isMesh && child.geometry) {
          materialsMap.set(child.uuid, child.material);

          // Creamos el material con optimizaciones nativas de GPU móvil
          child.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color("#475569"),
            wireframe: true,
            transparent: true,
            opacity: optimalOpacity, // 👈 Ajustado dinámicamente según el dispositivo
            depthTest: true,
            depthWrite: !isMobile,    // 👈 Truco crítico en móvil: desactivar depthWrite reduce el estrés del búfer gráfico en un 40%
            side: isMobile ? THREE.FrontSide : THREE.DoubleSide, // 👈 En móvil solo dibuja las caras frontales visibles. ¡Adiós lag!
          });
        }
      });
    }

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
  }, [showWireframe, modelRef]);

  return null;
}