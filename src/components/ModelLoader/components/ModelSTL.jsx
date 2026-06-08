import { useEffect, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { normalizeGeometry } from "../utils/geometry";
import LoadingOverlay from "./LoadingOverlay";

export default function ModelSTL({ url, onStats }) {
  const [mesh, setMesh] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMesh(null);

    new STLLoader().load(
      url,
      (geo) => {
        if (cancelled) return;
        geo.computeVertexNormals();

        const scale = normalizeGeometry(geo);

        const m = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({ color: "#8ecae6", metalness: 0.3, roughness: 0.5 })
        );
        
        m.scale.setScalar(scale);
        m.castShadow = true;
        m.receiveShadow = true;
        m.position.set(0, 0, 0);

        setMesh(m);
        setLoading(false);

        if (onStats) {
          const vCount = geo.attributes.position?.count ?? 0;
          onStats({
            vertices: vCount.toLocaleString(),
            polygons: Math.round(vCount / 3).toLocaleString(),
          });
        }
      },
      undefined,
      (err) => {
        console.error("STL error:", err);
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, [url, onStats]);

  if (loading) return <LoadingOverlay />;
  if (!mesh) return null;
  return <primitive object={mesh} />;
}