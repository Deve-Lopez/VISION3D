import { useEffect, useRef, useLayoutEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { normalizeObject } from "../utils/geometry";
import { calculateStats } from "../utils/stats";

export default function ModelGLTF({ url, onStats, showWireframe, explodeStrength }) {
  const groupRef = useRef();
  const { scene } = useGLTF(url, "https://www.gstatic.com/draco/versioned/decoders/1.5.5/");
  const normalized = useRef(false);
  const edgeLinesRef = useRef([]);
  const originalMaterialsRef = useRef(new Map());

  // Explosión
  const originsRef = useRef(new Map());
  const targetStrengthRef = useRef(0);
  const currentStrengthRef = useRef(0);

  useLayoutEffect(() => {
    if (groupRef.current && !normalized.current) {
      normalized.current = true;
      normalizeObject(groupRef.current);
      if (onStats) onStats(calculateStats(groupRef.current));
    }
  }, [scene, onStats]);

  useEffect(() => {
    normalized.current = false;
    originsRef.current.clear();
    currentStrengthRef.current = 0;
    targetStrengthRef.current = 0;
  }, [url]);

  // Guardar posiciones originales cuando carga el modelo
  useEffect(() => {
    if (!groupRef.current) return;

    const raf = requestAnimationFrame(() => {
      if (!groupRef.current) return;
      originsRef.current.clear();

      const box = new THREE.Box3().setFromObject(groupRef.current);
      const center = new THREE.Vector3();
      box.getCenter(center);

      groupRef.current.traverse((child) => {
        if (!child.isMesh) return;
        const childBox = new THREE.Box3().setFromObject(child);
        const childCenter = new THREE.Vector3();
        childBox.getCenter(childCenter);
        const direction = childCenter.clone().sub(center).normalize();
        originsRef.current.set(child.uuid, {
          position: child.position.clone(),
          direction,
        });
      });

      console.log("meshes para explotar:", originsRef.current.size);
    });

    return () => cancelAnimationFrame(raf);
  }, [scene]);

  // Actualizar target
  useEffect(() => {
    targetStrengthRef.current = explodeStrength ?? 0;
  }, [explodeStrength]);

  // Animación con lerp
  useFrame(() => {
    if (originsRef.current.size === 0) return;

    currentStrengthRef.current = THREE.MathUtils.lerp(
      currentStrengthRef.current,
      targetStrengthRef.current,
      0.08
    );

    groupRef.current?.traverse((child) => {
      if (!child.isMesh) return;
      const data = originsRef.current.get(child.uuid);
      if (!data) return;
      child.position.copy(data.position).addScaledVector(data.direction, currentStrengthRef.current);
    });
  });

  // Wireframe
  useEffect(() => {
    if (!groupRef.current) return;

    edgeLinesRef.current.forEach(({ parent, line }) => {
      parent.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    edgeLinesRef.current = [];

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
      const transparentMat = child.material.clone();
      transparentMat.transparent = true;
      transparentMat.opacity = 0.25;
      child.material = transparentMat;

      const edges = new THREE.EdgesGeometry(child.geometry, 5);
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
      edgeLinesRef.current.push({ parent: child, line });
    });

    return () => {
      edgeLinesRef.current.forEach(({ parent, line }) => {
        parent.remove(line);
        line.geometry.dispose();
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