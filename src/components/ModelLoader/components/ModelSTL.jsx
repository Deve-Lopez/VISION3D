import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { normalizeGeometry } from "../utils/geometry";
import LoadingOverlay from "./LoadingOverlay";

// Construye una geometría de "aristas con conciencia de cámara": para cada
// arista guarda la normal de las 1-2 caras que la forman. El shader usa esas
// normales para decidir, en tiempo real, si la arista mira hacia la cámara
// (cerca → nítida y oscura) o hacia el lado opuesto (lejos → muy atenuada,
// como las verías "a través" del cuerpo translúcido).
function buildFeatureEdges(geometry, thresholdDeg = 15, precision = 4) {
  const posAttr = geometry.attributes.position;
  const normAttr = geometry.attributes.normal; // ya viene flat-shaded (computeVertexNormals en geometría no indexada = normal de cara)
  const triCount = posAttr.count / 3;
  const thresholdRad = THREE.MathUtils.degToRad(thresholdDeg);

  const key = (x, y, z) => `${x.toFixed(precision)}_${y.toFixed(precision)}_${z.toFixed(precision)}`;
  const edgeMap = new Map();

  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();

  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3, i1 = t * 3 + 1, i2 = t * 3 + 2;
    vA.fromBufferAttribute(posAttr, i0);
    vB.fromBufferAttribute(posAttr, i1);
    vC.fromBufferAttribute(posAttr, i2);
    faceNormal.fromBufferAttribute(normAttr, i0);

    [[vA, vB], [vB, vC], [vC, vA]].forEach(([p0, p1]) => {
      const k0 = key(p0.x, p0.y, p0.z);
      const k1 = key(p1.x, p1.y, p1.z);
      const edgeKey = k0 < k1 ? `${k0}|${k1}` : `${k1}|${k0}`;

      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, { p0: p0.clone(), p1: p1.clone(), normals: [faceNormal.clone()] });
      } else {
        edgeMap.get(edgeKey).normals.push(faceNormal.clone());
      }
    });
  }

  const positions = [];
  const normalsA = [];
  const normalsB = [];

  edgeMap.forEach(({ p0, p1, normals }) => {
    const n0 = normals[0];
    const isBoundary = normals.length === 1;
    const n1 = normals[1] || n0;
    const angle = isBoundary ? Math.PI : n0.angleTo(n1);

    // Solo conservamos aristas "reales" (cambio de ángulo significativo) o
    // bordes abiertos de la malla — igual que antes, pero ahora cada arista
    // lleva consigo la info de hacia dónde miran sus caras.
    if (isBoundary || angle > thresholdRad) {
      positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
      normalsA.push(n0.x, n0.y, n0.z, n0.x, n0.y, n0.z);
      normalsB.push(n1.x, n1.y, n1.z, n1.x, n1.y, n1.z);
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("faceNormalA", new THREE.Float32BufferAttribute(normalsA, 3));
  geo.setAttribute("faceNormalB", new THREE.Float32BufferAttribute(normalsB, 3));
  return geo;
}

function createDepthCuedEdgeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color("#15181f") },
      nearOpacity: { value: 0.5 }, // arista "de cara" a la cámara
      farOpacity: { value: 0.12 },  // arista "al otro lado" (vista a través del cuerpo)
    },
    vertexShader: `
      attribute vec3 faceNormalA;
      attribute vec3 faceNormalB;
      varying float vFacing;
      void main() {
        vec3 viewNormalA = normalize(normalMatrix * faceNormalA);
        vec3 viewNormalB = normalize(normalMatrix * faceNormalB);
        // Si CUALQUIERA de las dos caras que forman la arista mira hacia
        // la cámara (z positivo en espacio de vista), la consideramos "cercana".
        vFacing = max(viewNormalA.z, viewNormalB.z);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float nearOpacity;
      uniform float farOpacity;
      varying float vFacing;
      void main() {
        float t = smoothstep(-0.3, 0.3, vFacing);
        gl_FragColor = vec4(color, mix(farOpacity, nearOpacity, t));
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

export default function ModelSTL({ url, onStats, showWireframe }) {
  const [mesh, setMesh] = useState(null);
  const [loading, setLoading] = useState(true);
  const groupRef = useRef();
  const edgeLinesRef = useRef([]);
  const originalMaterialsRef = useRef(new Map());

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
      (err) => { console.error("STL error:", err); setLoading(false); }
    );
    return () => { cancelled = true; };
  }, [url, onStats]);

  useEffect(() => {
    if (!mesh) return;

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

        // Cuerpo translúcido tipo "ghost": DoubleSide para que se note el
        // espesor/cavidades internas al ver a través, y depthWrite false
        // para que no compita por el depth buffer con las propias aristas.
        child.material = new THREE.MeshStandardMaterial({
          color: "#b0b6c4",
          metalness: 0.15,
          roughness: 0.55,
          transparent: true,
          opacity: 0.42,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const edgesGeo = buildFeatureEdges(child.geometry, 5);
        const edgeMat = createDepthCuedEdgeMaterial();
        const line = new THREE.LineSegments(edgesGeo, edgeMat);
        line.raycast = () => {};
        line.renderOrder = 1;
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
  }, [showWireframe, mesh]);

  if (loading) return <LoadingOverlay />;
  if (!mesh) return null;

  return (
    <group ref={groupRef}>
      <primitive object={mesh} />
    </group>
  );
}