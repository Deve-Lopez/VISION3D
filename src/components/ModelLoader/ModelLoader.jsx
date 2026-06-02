import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useGLTF, Html } from "@react-three/drei";
import styles from "./ModelLoader.module.css"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

function LoadingOverlay() {
  return (
    <Html center>
      <div className={styles.loader3d}>
        <div className={styles.spinner} />
        <span>Cargando modelo…</span>
      </div>
    </Html>
  );
}

// ── FUNCIÓN UNIFICADA: centra y escala cualquier Object3D ──
function normalizeObject(object) {
  // Paso 1: computar bounding box del objeto TAL COMO ESTÁ
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Paso 2: centrar desplazando la posición (no la geometría)
  object.position.sub(center);

  // Paso 3: escalar uniformemente para que quepa en un cubo 2.5
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    object.scale.multiplyScalar(2.5 / maxDim);
  }
}

// ── FUNCIÓN UNIFICADA: centra y escala una geometría (STL) ──
function normalizeGeometry(geo) {
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // Mover la geometría al origen
  geo.translate(-center.x, -center.y, -center.z);

  // Devolver el factor de escala uniforme
  return maxDim > 0 ? 2.5 / maxDim : 1;
}

// ── ESTADÍSTICAS ──
function calculateStats(object) {
  let vertices = 0;
  let polygons = 0;
  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const pos = child.geometry.attributes.position;
      if (pos) {
        vertices += pos.count;
        polygons += child.geometry.index
          ? child.geometry.index.count / 3
          : pos.count / 3;
      }
    }
  });
  return {
    vertices: vertices.toLocaleString(),
    polygons: Math.round(polygons).toLocaleString(),
  };
}

// ── GLTF ──
function ModelGLTF({ url, onStats }) {
  const groupRef = useRef();
  const { scene } = useGLTF(url, "https://www.gstatic.com/draco/versioned/decoders/1.5.5/");
  const normalized = useRef(false);

  // useLayoutEffect garantiza que el subtree ya está montado antes de leer Box3
  useLayoutEffect(() => {
    if (groupRef.current && !normalized.current) {
      normalized.current = true;
      normalizeObject(groupRef.current);
      if (onStats) onStats(calculateStats(groupRef.current));
    }
  }, [scene, onStats]);

  // Reset cuando cambia la URL
  useEffect(() => {
    normalized.current = false;
  }, [url]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// ── STL ──
function ModelSTL({ url, onStats }) {
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

        // normalizeGeometry centra la geo y devuelve el factor de escala
        const scale = normalizeGeometry(geo);

        const m = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({ color: "#8ecae6", metalness: 0.3, roughness: 0.5 })
        );
        // Aplicar escala al mesh (la geo ya está centrada en su origen)
        m.scale.setScalar(scale);
        m.castShadow = true;
        m.receiveShadow = true;
        // Posición explícita en el origen
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

// ── OBJ ──
function ModelOBJ({ url, onStats }) {
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

        // Normalizar DESPUÉS de asignar materiales (algunos OBJ tienen
        // transformaciones internas que afectan el Box3)
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

// ── EXPORT ──
export default function ModelLoader({ url, ext, onStats }) {
  if (ext === "stl") return <ModelSTL url={url} onStats={onStats} />;
  if (ext === "obj") return <ModelOBJ url={url} onStats={onStats} />;
  return <ModelGLTF url={url} onStats={onStats} />;
}