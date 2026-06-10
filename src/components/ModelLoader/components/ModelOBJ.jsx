import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { normalizeObject } from "../utils/geometry";
import { calculateStats } from "../utils/stats";
import LoadingOverlay from "./LoadingOverlay";

export default function ModelOBJ({ url, onStats, showWireframe }) {
  const [obj, setObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const groupRef = useRef();
  const edgeLinesRef = useRef([]);
  const originalMaterialsRef = useRef(new Map());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setObj(null);

    new OBJLoader().load(
      url,
      (object) => {
        if (cancelled) return;
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshStandardMaterial({
              color: "#8ecae6", metalness: 0.3, roughness: 0.5,
            });
          }
        });
        normalizeObject(object);
        setObj(object);
        setLoading(false);
        if (onStats) onStats(calculateStats(object));
      },
      undefined,
      (err) => { console.error("OBJ error:", err); setLoading(false); }
    );
    return () => { cancelled = true; };
  }, [url, onStats]);

  useEffect(() => {
    if (!obj) return;

    const raf = requestAnimationFrame(() => {
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
        edgeLinesRef.current.push({ parent: child, line });
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      edgeLinesRef.current.forEach(({ parent, line }) => {
        parent.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      });
      edgeLinesRef.current = [];
    };
  }, [showWireframe, obj]);

  if (loading) return <LoadingOverlay />;
  if (!obj) return null;

  return (
    <group ref={groupRef}>
      <primitive object={obj} />
    </group>
  );
}