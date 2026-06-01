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

// ── FUNCIÓN AUXILIAR PARA CONTAR POLÍGONOS Y VÉRTICES ──
function calculateStats(object) {
  let vertices = 0;
  let polygons = 0;

  object.traverse((child) => {
    if (child.isMesh) {
      const geometry = child.geometry;
      if (geometry) {
        const position = geometry.attributes.position;
        if (position) {
          vertices += position.count;
          
          // Si tiene un archivo de índices indexado
          if (geometry.index) {
            polygons += geometry.index.count / 3;
          } else {
            polygons += position.count / 3;
          }
        }
      }
    }
  });

  

  return { 
    vertices: vertices.toLocaleString(), 
    polygons: Math.round(polygons).toLocaleString() 
  };
}

// ── COMPONENTES MODIFICADOS PARA ENVIAR STATS ──

function ModelGLTF({ url, onStats }) {
  const groupRef = useRef();
  // Incluye soporte para compresión draco de una vez
  const { scene } = useGLTF(url, 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
  
  useEffect(() => {
    if (groupRef.current) {
      centerObject(groupRef.current);
      if (onStats) onStats(calculateStats(groupRef.current));
    }
  }, [scene, onStats]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

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

        // Envío de estadísticas para STL
        if (onStats) {
          const vCount = geo.attributes.position ? geo.attributes.position.count : 0;
          onStats({
            vertices: vCount.toLocaleString(),
            polygons: Math.round(vCount / 3).toLocaleString()
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
        centerObject(object);
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

// ── EXPORTACIÓN PRINCIPAL COHESIONADA ──
export default function ModelLoader({ url, ext, onStats }) {
  if (ext === "stl") return <ModelSTL url={url} onStats={onStats} />;
  if (ext === "obj") return <ModelOBJ url={url} onStats={onStats} />;
  return <ModelGLTF url={url} onStats={onStats} />;
}