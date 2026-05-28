import { useState, useEffect, useRef } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

function LoadingOverlay() {
  return (
    <Html center>
      <div className="loader-3d">
        <div className="spinner" style={{ width: 28, height: 28, marginBottom: 4 }} />
        <span>Cargando modelo…</span>
      </div>
    </Html>
  );
}

function centerObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  object.position.set(-center.x, -center.y, -center.z);
  object.scale.setScalar(2.5 / maxDim);
}

function centerGeometry(geo) {
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  geo.translate(-center.x, -center.y, -center.z);
  return 2.5 / maxDim;
}

function ModelGLTF({ url }) {
  const groupRef = useRef();
  const { scene } = useGLTF(url);
  useEffect(() => {
    if (groupRef.current) centerObject(groupRef.current);
  }, [scene]);
  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function ModelSTL({ url }) {
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
        const scale = centerGeometry(geo);
        const m = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({ color: "#8ecae6", metalness: 0.3, roughness: 0.5 })
        );
        m.scale.setScalar(scale);
        m.castShadow = true;
        m.receiveShadow = true;
        setMesh(m);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("STL error:", err);
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, [url]);

  if (loading) return <LoadingOverlay />;
  if (!mesh) return null;
  return <primitive object={mesh} />;
}

function ModelOBJ({ url }) {
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
        centerObject(object);
        setObj(object);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("OBJ error:", err);
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, [url]);

  if (loading) return <LoadingOverlay />;
  if (!obj) return null;
  return <primitive object={obj} />;
}

export default function ModelLoader({ url, ext }) {
  if (ext === "stl") return <ModelSTL url={url} />;
  if (ext === "obj") return <ModelOBJ url={url} />;
  return <ModelGLTF url={url} />;
}