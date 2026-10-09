import { GLTFLoader } from "./vendor/GLTFLoader.js?v=94f9b88e35285f1e";
const templates = new Map();
let loading;
// Bounded, optional artwork loading: a missing model must never prevent play.
export function preloadFurniture() {
  return (loading ??= Promise.all(
    [
      "standard-single-bed",
      "dining-set",
      "cafe-counter",
      "service-counter",
      "bar-counter",
      "treadmill",
      "pool-lounger",
      "pool-umbrella",
      "spa-bed",
      "coastal-planter",
      "reception-desk",
      "boutique-bed",
      "bedside-lamp",
      "seaside-armchair",
      "lobby-limestone",
      "lobby-runner",
      "upstairs-carpet",
      "bedroom-oak-floor",
      "bedroom-panel-wall",
      "bedroom-doorway",
      "rooftop-pavers",
      "rooftop-teak-deck",
      "rooftop-railing",
    ].map(async (name) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(
          new URL(`./assets/models/${name}.glb?v=94f9b88e35285f1e`, import.meta.url),
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const gltf = await new GLTFLoader().parseAsync(
          await response.arrayBuffer(),
          "",
        );
        templates.set(name, gltf.scene);
      } catch (error) {
        console.warn(`Using built-in ${name} artwork:`, error.message);
      } finally {
        clearTimeout(timeout);
      }
    }),
  ));
}
// Each instance owns geometry; each view owns cached materials. Rebuilding rooms
// or disposing a floor cannot invalidate another floor or the source template.
export function furniture(
  name,
  materials,
  customize = () => {},
  variant = "default",
) {
  const template = templates.get(name);
  if (!template) return null;
  const instance = template.clone(true);
  instance.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry = object.geometry.clone();
    const source = object.material;
    const key = `furniture:${name}:${source.name}:${variant}`;
    if (!materials.has(key)) {
      const material = source.clone();
      customize(material);
      materials.set(key, material);
    }
    object.material = materials.get(key);
    object.castShadow = true;
    object.receiveShadow = true;
  });
  return instance;
}
