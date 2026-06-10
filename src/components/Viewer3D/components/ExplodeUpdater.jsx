import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * Separa las piezas del modelo desde su centro común (vista explosionada).
 * Anima suavemente la transición con lerp.
 */
export function ExplodeUpdater({ modelRef, explodeStrength, modelUrl }) {
  const originsRef = useRef(new Map());
  const targetStrengthRef = useRef(0);
  const currentStrengthRef = useRef(0);

  // Guardar posiciones originales cuando cambia el modelo
  useEffect(() => {
    if (!modelRef?.current) return;

    const raf = requestAnimationFrame(() => {
      if (!modelRef?.current) return;
      originsRef.current.clear();

      const center = new THREE.Vector3();
      const box = new THREE.Box3().setFromObject(modelRef.current);
      box.getCenter(center);

      let count = 0;
      modelRef.current.traverse((child) => {
        if (!child.isMesh) return;
        count++;

        const childCenter = new THREE.Vector3();
        new THREE.Box3().setFromObject(child).getCenter(childCenter);

        const direction = childCenter.clone().sub(center).normalize();

        originsRef.current.set(child.uuid, {
          position: child.position.clone(),
          direction,
        });
      });

      console.log("meshes guardados en originsRef:", count);
      currentStrengthRef.current = 0;
      targetStrengthRef.current = 0;
    });

    return () => cancelAnimationFrame(raf);
  }, [modelUrl, modelRef]);

  useEffect(() => {
    targetStrengthRef.current = explodeStrength;
  }, [explodeStrength]);

  useEffect(() => {
    console.log("explodeStrength cambió:", explodeStrength);
    targetStrengthRef.current = explodeStrength;
  }, [explodeStrength]);

  useFrame(() => {
    if (!modelRef?.current || originsRef.current.size === 0) return;

    currentStrengthRef.current = THREE.MathUtils.lerp(
      currentStrengthRef.current,
      targetStrengthRef.current,
      0.08
    );

    const strength = currentStrengthRef.current;

    modelRef.current.traverse((child) => {
      if (!child.isMesh) return;
      const data = originsRef.current.get(child.uuid);
      if (!data) return;

      child.position.copy(data.position).addScaledVector(data.direction, strength);
    });
  });

  return null;
}