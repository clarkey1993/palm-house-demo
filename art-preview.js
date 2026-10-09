import * as T from "./vendor/three.module.js?v=a8268884754de4a5";
function startStudio() {
  const canvas = document.querySelector("#studio");
  const scene = new T.Scene();
  scene.background = new T.Color("#b4d9d0");
  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 150);
  const materials = new Map(),
    geometries = new Map();
  function mat(color, roughness = 0.7, metalness = 0) {
    const key = [color, roughness, metalness].join();
    if (!materials.has(key))
      materials.set(
        key,
        new T.MeshStandardMaterial({ color, roughness, metalness }),
      );
    return materials.get(key);
  }
  function mesh(geo, color, x, y, z, parent = scene, rough = 0.7, metal = 0) {
    const m = new T.Mesh(geo, mat(color, rough, metal));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  // Bevel every furniture edge: the highlight is geometry, not a painted outline.
  function roundedGeo(w, h, d, r) {
    const key = [w, h, d, r].join();
    if (geometries.has(key)) return geometries.get(key);
    r = Math.min(r, w / 3, h / 3, d / 3);
    const x = w / 2 - r,
      y = d / 2 - r;
    const shape = new T.Shape();
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x, y);
    shape.lineTo(-x, y);
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, {
      depth: h - 2 * r,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: r,
      bevelThickness: r,
      curveSegments: 5,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -h / 2 + r, 0);
    geometries.set(key, geo);
    return geo;
  }
  function box(w, h, d, color, x, y, z, p = scene, r = 0.06) {
    const item = mesh(roundedGeo(w, h, d, r), color, x, y, z, p);
    if (h < 0.03) item.castShadow = false;
    return item;
  }
  function ball(r, color, x, y, z, p = scene) {
    return mesh(new T.SphereGeometry(r, 20, 14), color, x, y, z, p);
  }
  function cylinder(r, h, color, x, y, z, p = scene, rough = 0.6, metal = 0) {
    return mesh(
      new T.CylinderGeometry(r, r, h, 24),
      color,
      x,
      y,
      z,
      p,
      rough,
      metal,
    );
  }
  function group(x, y, z, p = scene) {
    const g = new T.Group();
    g.position.set(x, y, z);
    p.add(g);
    return g;
  }
  function textLabel(text, w, h, x, y, z, p = scene) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#21574d";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#f8e4b1";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "500 106px Georgia";
    ctx.fillText(text, 512, 133, 950);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    const m = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshStandardMaterial({ map: texture, roughness: 0.7 }),
    );
    m.position.set(x, y, z);
    p.add(m);
    return m;
  }
  // An original repeating weave, generated locally; no downloaded textures.
  const weave = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const value =
        145 + (x % 4 === 0 || y % 4 === 0 ? 30 : 0) + ((x * 17 + y * 13) % 9);
      const i = (y * 64 + x) * 4;
      weave[i] = weave[i + 1] = weave[i + 2] = value;
      weave[i + 3] = 255;
    }
  const cloth = new T.DataTexture(weave, 64, 64);
  cloth.wrapS = cloth.wrapT = T.RepeatWrapping;
  cloth.repeat.set(5, 5);
  cloth.needsUpdate = true;
  for (const color of [
    "#f4ead7",
    "#fffaf0",
    "#d5a071",
    "#669486",
    "#6c9a91",
    "#faf0d6",
    "#3d7769",
  ]) {
    const fabric = mat(color);
    fabric.bumpMap = cloth;
    fabric.bumpScale = 0.012;
    fabric.roughness = 0.95;
  }
  scene.add(new T.HemisphereLight("#fff0d5", "#719b93", 2));
  const sun = new T.DirectionalLight("#fff2d2", 3.2);
  sun.position.set(-8, 16, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -14,
    right: 14,
    top: 14,
    bottom: -14,
    near: 1,
    far: 50,
  });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  const fill = new T.DirectionalLight("#b9e5f1", 0.65);
  fill.position.set(10, 7, -4);
  scene.add(fill);
  box(200, 0.3, 200, "#99c7bd", 0, -0.8, 0, scene, 0.1);
  const hotel = group(0, 0, 0);
  box(18, 0.45, 11, "#d8c49a", 0, -0.3, 0, hotel, 0.22);
  box(17.8, 0.14, 10.8, "#f1e8d6", 0, -0.01, 0, hotel, 0.06);
  for (let z = -5; z < 5; z += 0.65)
    box(17.5, 0.012, 0.018, "#dfd2b9", 0, 0.07, z, hotel, 0.003);
  // A tactile boutique reception, with fluted oak and a stone countertop.
  const lobby = group(-4.4, 0, 0.4, hotel);
  box(7.6, 3.2, 0.22, "#7fae99", 0, 1.65, -4, lobby, 0.06);
  box(7.8, 0.16, 0.35, "#eee1c6", 0, 3.29, -4, lobby);
  for (let x = -3.4; x < 3.5; x += 0.38)
    box(0.06, 2.55, 0.07, "#94bfa7", x, 1.75, -3.84, lobby, 0.02);
  box(4, 0.95, 0.14, "#b49a66", 0, 2.4, -3.72, lobby);
  textLabel("PALM HOUSE", 3.8, 0.8, 0, 2.4, -3.635, lobby);
  box(5.4, 0.025, 3.9, "#7eaaa0", 0, 0.09, 1, lobby, 0.12);
  box(5.1, 0.018, 3.6, "#b2c9b4", 0, 0.11, 1, lobby, 0.1);
  for (let x = -2.4; x < 2.5; x += 0.12)
    box(0.035, 0.009, 3.35, "#a6bda9", x, 0.126, 1, lobby, 0.003);
  const desk = group(0, 0, -0.8, lobby);
  box(4.8, 1.2, 1.45, "#996d4d", 0, 0.76, 0, desk, 0.16);
  box(4.5, 0.13, 1.25, "#654d39", 0, 0.18, 0, desk);
  for (let x = -2.22; x < 2.24; x += 0.16)
    cylinder(0.06, 1.03, "#c89969", x, 0.79, 0.69, desk);
  box(5.05, 0.21, 1.67, "#fff0d6", 0, 1.43, 0, desk, 0.09);
  box(1.25, 0.3, 0.045, "#3e7160", 0, 0.89, 0.77, desk, 0.03);
  textLabel("WELCOME", 1.12, 0.23, 0, 0.89, 0.798, desk);
  box(0.62, 0.035, 0.43, "#456b5e", -0.95, 1.57, -0.1, desk, 0.015);
  const monitor = box(
    0.65,
    0.45,
    0.065,
    "#32534e",
    -0.95,
    1.8,
    -0.24,
    desk,
    0.025,
  );
  monitor.rotation.x = -0.18;
  cylinder(0.13, 0.04, "#c6a15e", 1.25, 1.575, 0.22, desk, 0.3, 0.65);
  const bell = ball(0.105, "#d4af66", 1.25, 1.62, 0.22, desk);
  bell.scale.y = 0.55;
  box(0.56, 0.045, 0.4, "#bb8c67", 0.45, 1.57, 0.17, desk, 0.015);
  box(0.49, 0.018, 0.36, "#fffae9", 0.45, 1.602, 0.17, desk, 0.008);
  // Upholstered room, layered linen, bedside lighting and original botanical art.
  const room = group(4.45, 0, -0.1, hotel);
  box(7.65, 3.1, 0.22, "#e7c6b4", 0, 1.6, -4.3, room);
  box(7.8, 0.15, 0.32, "#f7e7ca", 0, 3.2, -4.3, room);
  box(7.6, 0.07, 8.6, "#dfc9a7", 0, 0.12, 0, room);
  for (let x = -3.6; x < 3.8; x += 0.62)
    box(0.018, 0.012, 8.4, "#cfb995", x, 0.162, 0, room, 0.003);
  box(5.2, 0.035, 5.8, "#d3b68e", 0, 0.2, 0.4, room, 0.13);
  box(4.85, 0.015, 5.45, "#ece0be", 0, 0.226, 0.4, room, 0.1);
  for (let z = -2; z < 3; z += 0.11)
    box(4.65, 0.006, 0.023, "#dfd0ac", 0, 0.239, z, room, 0.003);
  box(3.6, 0.35, 4.5, "#987553", 0, 0.47, -0.5, room, 0.13);
  box(3.75, 1.65, 0.3, "#669486", 0, 1.1, -2.55, room, 0.14);
  for (let x = -1.45; x < 1.6; x += 0.48)
    box(0.045, 1.33, 0.02, "#80a99a", x, 1.14, -2.384, room, 0.01);
  box(3.42, 0.38, 4.25, "#fff5dc", 0, 0.83, -0.43, room, 0.16);
  box(3.48, 0.16, 2.9, "#f4ead7", 0, 1.08, 0.28, room, 0.075);
  for (let x of [-0.85, 0.85]) {
    box(1.37, 0.22, 0.8, "#fffaf0", x, 1.1, -1.8, room, 0.1);
    const cushion = box(0.69, 0.2, 0.63, "#d5a071", x, 1.29, -1.42, room, 0.09);
    cushion.rotation.y = x * 0.1;
  }
  box(3.5, 0.055, 1.12, "#6c9a91", 0, 1.19, 1.05, room, 0.025);
  for (let x = -1.6; x < 1.7; x += 0.13)
    box(0.022, 0.008, 1.04, "#8bb3a4", x, 1.224, 1.05, room, 0.003);
  for (const x of [-2.7, 2.7]) {
    box(0.95, 0.65, 0.86, "#bb9469", x, 0.62, -2, room);
    box(1.03, 0.1, 0.92, "#f6dfb6", x, 0.995, -2, room);
    cylinder(0.03, 0.07, "#caad6d", x, 0.66, -1.53, room, 0.3, 0.6).rotation.x =
      Math.PI / 2;
    cylinder(0.16, 0.045, "#c9a667", x, 1.08, -2.1, room, 0.3, 0.6);
    cylinder(0.035, 0.43, "#c9a667", x, 1.31, -2.1, room, 0.3, 0.6);
    mesh(
      new T.CylinderGeometry(0.24, 0.34, 0.4, 24),
      "#fff1cf",
      x,
      1.62,
      -2.1,
      room,
    );
  }
  box(1.25, 1.3, 0.09, "#c7a36f", 2.5, 2.25, -4.13, room, 0.025);
  box(1.08, 1.13, 0.04, "#fff4dc", 2.5, 2.25, -4.07, room, 0.01);
  for (let i = 0; i < 5; i++) {
    const leaf = ball(
      0.18,
      "#6c9680",
      2.5 + Math.sin(i * 2) * 0.22,
      1.91 + i * 0.16,
      -4.03,
      room,
    );
    leaf.scale.set(1, 0.45, 0.09);
    leaf.rotation.z = i * 0.55;
  }
  function plant(x, z, p) {
    const g = group(x, 0, z, p);
    mesh(
      new T.CylinderGeometry(0.35, 0.25, 0.65, 24),
      "#dfb38b",
      0,
      0.42,
      0,
      g,
    );
    cylinder(0.29, 0.03, "#766148", 0, 0.76, 0, g);
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4;
      const stem = ball(
        0.3,
        "#507f66",
        Math.sin(a) * 0.3,
        1 + i * 0.055,
        Math.cos(a) * 0.25,
        g,
      );
      stem.scale.set(0.6, 1.8, 0.38);
      stem.rotation.z = Math.sin(a) * 0.45;
    }
  }
  plant(-3.25, -2.7, lobby);
  plant(3.2, 2.8, room);
  // A more sculpted manager: capsule limbs, cheeks, swept hair, tailored uniform.
  const manager = group(-4.4, 0.1, 2.4);
  manager.rotation.y = 0.35;
  const body = group(0, 0, 0, manager);
  mesh(new T.CapsuleGeometry(0.27, 0.35, 6, 16), "#faf0d6", 0, 1.04, 0, body);
  box(0.47, 0.5, 0.08, "#3d7769", 0, 0.96, 0.25, body, 0.035);
  const head = ball(0.32, "#d5a078", 0, 1.68, 0, body);
  head.scale.set(0.94, 1.07, 0.92);
  for (const x of [-0.3, 0.3]) ball(0.075, "#d5a078", x, 1.66, 0, body);
  ball(0.065, "#dca982", 0, 1.65, 0.29, body);
  for (const x of [-0.115, 0.115]) {
    const eye = ball(0.037, "#343d35", x, 1.72, 0.267, body);
    eye.scale.z = 0.48;
    ball(0.012, "#fff9ed", x - 0.009, 1.735, 0.283, body);
    const brow = box(0.1, 0.023, 0.024, "#5c4230", x, 1.8, 0.267, body, 0.008);
    brow.rotation.z = x > 0 ? -0.08 : 0.08;
  }
  const hair = ball(0.326, "#5c4332", 0, 1.85, -0.035, body);
  hair.scale.set(1, 0.65, 1);
  const sweep = ball(0.21, "#624835", -0.14, 1.93, 0.13, body);
  sweep.scale.set(1.2, 0.44, 0.85);
  sweep.rotation.z = -0.24;
  const smile = mesh(
    new T.TorusGeometry(0.062, 0.012, 6, 12, Math.PI),
    "#815441",
    0,
    1.57,
    0.293,
    body,
  );
  smile.rotation.z = Math.PI;
  box(0.08, 0.08, 0.025, "#d7b673", 0.14, 1.2, 0.29, body, 0.01);
  cylinder(0.3, 0.1, "#faf0d6", 0, 2.065, 0, body);
  cylinder(0.35, 0.04, "#cfb175", 0, 2.015, 0.02, body);
  const legs = [],
    arms = [];
  for (const side of [-1, 1]) {
    const leg = group(side * 0.15, 0.67, 0, manager);
    mesh(new T.CapsuleGeometry(0.105, 0.31, 4, 12), "#355b51", 0, -0.2, 0, leg);
    box(0.24, 0.17, 0.38, "#684e3c", 0, -0.44, 0.06, leg, 0.065);
    legs.push(leg);
    const arm = group(side * 0.35, 1.27, 0, body);
    mesh(
      new T.CapsuleGeometry(0.085, 0.24, 4, 12),
      "#faf0d6",
      0,
      -0.14,
      0,
      arm,
    );
    ball(0.092, "#d5a078", 0, -0.38, 0, arm);
    arms.push(arm);
  }
  const views = {
    all: {
      at: [0, 0.5, 0],
      distance: 27,
      title: "Soft upholstery. Warm oak. Sea-glass green.",
      detail:
        "A separate visual prototype. Your hotel and saved progress are untouched.",
    },
    desk: {
      at: [-4.4, 1, -1],
      distance: 15,
      title: "A reception with a little personality.",
      detail:
        "Rounded stone, fluted oak, a brass bell and a welcoming boutique sign.",
    },
    room: {
      at: [4.45, 0.8, -0.5],
      distance: 15,
      title: "A room worth staying in.",
      detail:
        "Layered linen, a stitched headboard, woven rug and warm bedside details.",
    },
    player: {
      at: [-4.4, 1.2, 2.4],
      distance: 5.5,
      title: "Meet your hotel manager.",
      detail:
        "A sculpted face, tailored uniform and jointed limbs. Original procedural art, ready for further refinement.",
    },
  };
  let selected = "all",
    yaw = 0.25,
    pitch = 0.72,
    distance = 27,
    targetDistance = 27,
    time = 0,
    last = 0,
    running = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const focus = new T.Vector3(0, 0.5, 0),
    wanted = focus.clone();
  function choose(name) {
    selected = name;
    const v = views[name];
    wanted.set(...v.at);
    targetDistance = v.distance;
    document.querySelector("#caption").textContent = v.title;
    document.querySelector("#detail").textContent = v.detail;
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.view === name)),
      );
    yaw = name === "player" ? 0.2 : 0.25;
    pitch = name === "player" ? 0.23 : 0.72;
  }
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => (b.onclick = () => choose(b.dataset.view)));
  function motionButton() {
    const b = document.querySelector("#motion");
    b.textContent = running ? "Pause motion" : "Play motion";
    b.setAttribute("aria-pressed", String(running));
  }
  motionButton();
  document.querySelector("#motion").onclick = () => {
    running = !running;
    motionButton();
  };
  document.querySelector("#reset").onclick = () => choose(selected);
  const pointers = new Map();
  let pinch = 0;
  canvas.onpointerdown = (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch = 0;
  };
  canvas.onpointermove = (e) => {
    const old = pointers.get(e.pointerId);
    if (!old) return;
    const dx = e.clientX - old.x,
      dy = e.clientY - old.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch)
        targetDistance = Math.max(
          3.5,
          Math.min(45, (targetDistance * pinch) / Math.max(1, d)),
        );
      pinch = d;
    } else {
      yaw -= dx * 0.008;
      pitch = Math.max(0.12, Math.min(1.35, pitch + dy * 0.005));
    }
  };
  canvas.onpointerup = canvas.onpointercancel = (e) => {
    pointers.delete(e.pointerId);
    pinch = 0;
  };
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      targetDistance = Math.max(
        3.5,
        Math.min(45, targetDistance * Math.exp(e.deltaY * 0.001)),
      );
    },
    { passive: false },
  );
  window.addEventListener("blur", () => pointers.clear());
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();
  function frame(t) {
    const dt = Math.min(0.04, (t - last) / 1000 || 0);
    last = t;
    if (!document.hidden) {
      if (running) time += dt;
      focus.lerp(wanted, 1 - Math.exp(-dt * 7));
      distance += (targetDistance - distance) * (1 - Math.exp(-dt * 7));
      const portrait = innerWidth < 700 ? 1.45 : 1;
      const d = distance * portrait;
      camera.position.set(
        focus.x + Math.sin(yaw) * Math.cos(pitch) * d,
        focus.y + Math.sin(pitch) * d,
        focus.z + Math.cos(yaw) * Math.cos(pitch) * d,
      );
      camera.lookAt(focus);
      const stride = Math.sin(time * 5);
      legs.forEach((l, i) => (l.rotation.x = stride * 0.3 * (i ? 1 : -1)));
      arms.forEach((a, i) => (a.rotation.x = -stride * 0.22 * (i ? 1 : -1)));
      body.position.y = Math.abs(stride) * 0.025;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
try {
  startStudio();
} catch (error) {
  const message = document.querySelector("#error");
  message.hidden = false;
  message.textContent =
    "This 3D preview needs WebGL. Try a recent Safari or Chrome browser with graphics enabled.";
  console.error(error);
}
