import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function CameraFitter({ modelUrl }) {
  const { camera, scene } = useThree();
  const fitted = useRef(null);

  useEffect(() => { fitted.current = null; }, [modelUrl]);

  useFrame(() => {
    if (!modelUrl || fitted.current === modelUrl) return;

    let hasMesh = false;
    scene.traverse((o) => { if (o.isMesh) hasMesh = true; });
    if (!hasMesh) return;

    const box = new THREE.Box3();
    scene.traverse((o) => { if (o.isMesh) box.expandByObject(o); });
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 2.5;

    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.lookAt(center);

    camera.near = distance * 0.01;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    fitted.current = modelUrl;
  });

  return null;
}