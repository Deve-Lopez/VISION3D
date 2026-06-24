import { useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { normalizeObject } from "../utils/geometry";
import { calculateStats } from "../utils/stats";

export default function ModelGLTF({ url, onStats, showWireframe }) {
  const groupRef = useRef();

  const { scene: originalScene } = useGLTF(url, "https://www.gstatic.com/draco/versioned/decoders/1.5.5/");

  const scene = useMemo(() => originalScene.clone(), [url, originalScene]);

  const normalized = useRef(false);
  const edgeLinesRef = useRef([]); // { parent, line, sharedGeometry }
  const originalMaterialsRef = useRef(new Map());

  useLayoutEffect(() => {
    if (groupRef.current && !normalized.current) {
      normalized.current = true;
      normalizeObject(groupRef.current);
      if (onStats) onStats(calculateStats(groupRef.current));
    }
  }, [scene, onStats]);

  useEffect(() => {
    normalized.current = false;
  }, [url]);

  // Wireframe (mismo patrón que ModelSTL)
  useEffect(() => {
    if (!groupRef.current) return;

    const raf = requestAnimationFrame(() => {
      if (!groupRef.current) return;

      // Limpieza de aristas / clones anteriores
      edgeLinesRef.current.forEach(({ parent, line, sharedGeometry }) => {
        parent.remove(line);
        if (!sharedGeometry) line.geometry.dispose();
        line.material.dispose();
      });
      edgeLinesRef.current = [];

      // Restaurar materiales originales
      if (originalMaterialsRef.current.size > 0) {
        groupRef.current.traverse((child) => {
          if (child.isMesh && originalMaterialsRef.current.has(child.uuid)) {
            child.material = originalMaterialsRef.current.get(child.uuid);
          }
        });
        originalMaterialsRef.current.clear();
      }

      if (!showWireframe) return;

      groupRef.current.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;

        originalMaterialsRef.current.set(child.uuid, child.material);

        if (child.isSkinnedMesh) {
          // EdgesGeometry no sigue la deformación de huesos.
          // Clonamos el propio nodo SkinnedMesh (comparte skeleton y
          // bindMatrix con el original, así que se deforma idéntico)
          // y le ponemos un material wireframe plano y oscuro, igual
          // que el resto de modelos: cuerpo transparente + líneas
          // uniformes encima.
          const wireClone = child.clone();
          wireClone.material = new THREE.MeshBasicMaterial({
            color: "#0f172a",
            wireframe: true,
            transparent: true,
            opacity: 0.65,
          });
          wireClone.raycast = () => {};
          child.parent.add(wireClone);

          const bodyMat = child.material.clone();
          bodyMat.transparent = true;
          bodyMat.opacity = 1;
          child.material = bodyMat;

          edgeLinesRef.current.push({
            parent: child.parent,
            line: wireClone,
            sharedGeometry: true, // ¡no liberar! la geometría es la del mesh original
          });
          return;
        }

        const transparentMat = child.material.clone();
        transparentMat.transparent = true;
        transparentMat.opacity = 0.5;
        child.material = transparentMat;

        const edges = new THREE.EdgesGeometry(child.geometry, 4);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: "#0f172a",
            transparent: false,
            opacity: 1,
            depthTest: true,
            linewidth: 2,
          })
        );
        line.raycast = () => {};
        child.add(line);
        edgeLinesRef.current.push({ parent: child, line, sharedGeometry: false });
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      edgeLinesRef.current.forEach(({ parent, line, sharedGeometry }) => {
        parent.remove(line);
        if (!sharedGeometry) line.geometry.dispose();
        line.material.dispose();
      });
      edgeLinesRef.current = [];
    };
  }, [showWireframe, scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}