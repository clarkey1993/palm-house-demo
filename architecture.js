import * as T from "./vendor/three.module.js";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";
import { furniture } from "./furniture.js";
import { DECOR } from "./decor.js";
export const ARCHITECTURE = [
  "lobby-limestone",
  "lobby-runner",
  "upstairs-carpet",
  "bedroom-oak-floor",
  "bedroom-panel-wall",
  "bedroom-doorway",
  "rooftop-pavers",
  "rooftop-teak-deck",
  "rooftop-railing",
];
export function architecturalModel(view, name) {
  return furniture(
    name,
    view.materials,
    (material) => {
      const n = material.name;
      let role;
      if (n.startsWith("Sea glass upholstery")) role = "wall";
      else if (
        n.startsWith("Corridor carpet") ||
        n.startsWith("Sea glass runner")
      )
        role = "carpet";
      else if (n.startsWith("Carpet border")) role = "border";
      if (role) {
        const original = material.color.getHex();
        material.userData.decor = { role, original };
        const palette = (DECOR.find((d) => d.id === view.decor) || DECOR[0])
          .colors;
        material.color.setHex(palette[role] ?? original);
      }
    },
    "architecture",
  );
}
export function coverFloor(view, name, parent, x, z, width, depth, y) {
  const first = architecturalModel(view, name);
  if (!first) return false;
  const nativeWidth = name === "lobby-runner" ? 2.35 : 4;
  const tileWidth = ["lobby-runner", "upstairs-carpet"].includes(name)
    ? width
    : nativeWidth;
  const group = new T.Group(),
    batches = new Map();
  // Merge tiled geometry by material, keeping floor draw calls independent of area.
  for (let dz = 0; dz < depth - 1e-6; dz += 4)
    for (let dx = 0; dx < width - 1e-6; dx += tileWidth) {
      const tile =
        dx === 0 && dz === 0 ? first : architecturalModel(view, name);
      const w = Math.min(tileWidth, width - dx),
        d = Math.min(4, depth - dz);
      tile.scale.set(w / nativeWidth, 1, d / 4);
      tile.position.set(
        x - width / 2 + dx + w / 2,
        y,
        z - depth / 2 + dz + d / 2,
      );
      tile.updateMatrixWorld(true);
      tile.traverse((o) => {
        if (o.isMesh) {
          o.geometry.applyMatrix4(o.matrixWorld);
          if (!batches.has(o.material)) batches.set(o.material, []);
          batches.get(o.material).push(o.geometry);
        }
      });
    }
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    for (const g of geometries) g.dispose();
    const mesh = new T.Mesh(merged, material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);
  }
  parent.add(group);
  return true;
}
export function placeArchitecture(
  view,
  name,
  parent,
  x,
  y,
  z,
  width,
  angle = 0,
  height = 1,
) {
  const model = architecturalModel(view, name);
  if (!model) return false;
  model.position.set(x, y, z);
  model.rotation.y = angle;
  model.scale.set(width / 4, height, 1);
  parent.add(model);
  return true;
}
