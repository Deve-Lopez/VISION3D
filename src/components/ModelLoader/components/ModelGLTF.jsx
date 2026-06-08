import { useEffect, useRef, useLayoutEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { normalizeObject } from "../utils/geometry";
import { calculateStats } from "../utils/stats";

export default function ModelGLTF({ url, onStats }) {
  const groupRef = useRef();
  const { scene } = useGLTF(url, "https://www.gstatic.com/draco/versioned/decoders/1.5.5/");
  const normalized = useRef(false);

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

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}