import { useEffect, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { normalizeObject } from "../utils/geometry";
import { calculateStats } from "../utils/stats";
import LoadingOverlay from "./LoadingOverlay";

export default function ModelOBJ({ url, onStats }) {
  const [obj, setObj] = useState(null);
  const [loading, setLoading] = useState(true);

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
      (err) => {
        console.error("OBJ error:", err);
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, [url, onStats]);

  if (loading) return <LoadingOverlay />;
  if (!obj) return null;
  return <primitive object={obj} />;
}