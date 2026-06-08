/**
 * Recorre el objeto 3D para calcular de manera exacta el número de vértices y polígonos
 */
export function calculateStats(object) {
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