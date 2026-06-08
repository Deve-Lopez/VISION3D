import * as THREE from "three";

/**
 * Centra un Object3D desplazando su posición y lo escala para ajustarlo a un cubo de 2.5
 */
export function normalizeObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  object.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    object.scale.multiplyScalar(2.5 / maxDim);
  }
}

/**
 * Centra la geometría directamente en sus vértices y devuelve el factor de escala ideal
 */
export function normalizeGeometry(geo) {
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  geo.translate(-center.x, -center.y, -center.z);

  return maxDim > 0 ? 2.5 / maxDim : 1;
}