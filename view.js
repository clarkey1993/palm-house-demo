import { coverFloor, placeArchitecture } from "./architecture.js?v=07f894a9cb744be8";
import { furniture } from "./furniture.js?v=07f894a9cb744be8";
import { stepMotion, motionPose } from "./animation.js?v=07f894a9cb744be8";
import { DECOR } from "./decor.js?v=07f894a9cb744be8";
import * as T from "./vendor/three.module.js?v=07f894a9cb744be8";
import {
  ROOMS,
  cafeOffset,
  benefit,
  CLEAN_SPOTS,
  roomCount,
  roomRate,
  unlocked,
  staffCount,
  onDuty,
  ROLE_BY_PAD,
  nextWage,
  workRate,
  PADS,
  padPosition,
  RECEPTION,
  price,
  complete,
  label,
  distance,
} from "./model.js?v=07f894a9cb744be8";
const colors = {
  sand: 0xf4ddae,
  cream: 0xfff5da,
  wood: 0xc88757,
  mint: 0x91baa0,
  green: 0x306653,
  coral: 0xe28d77,
  blue: 0x71b8c5,
};
export class HotelView {
  constructor(canvas, game) {
    this.game = game;
    this.canvas = canvas;
    this.scene = new T.Scene();
    this.scene.background = new T.Color(0x91d6ce);
    this.scene.fog = new T.Fog(0x91d6ce, 70, 160);
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    // A transparent player-only pass sits above the fixed HTML price cards.
    this.playerOverlay = new T.WebGLRenderer({ antialias: true, alpha: true });
    this.playerOverlay.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.playerOverlay.outputColorSpace = this.renderer.outputColorSpace;
    this.playerOverlay.toneMapping = this.renderer.toneMapping;
    this.playerOverlay.toneMappingExposure = this.renderer.toneMappingExposure;
    this.playerOverlay.setClearColor(0x000000, 0);
    this.playerOverlay.domElement.className = "player-overlay";
    this.playerOverlay.domElement.setAttribute("aria-hidden", "true");
    document.querySelector("#labels").append(this.playerOverlay.domElement);
    this.camera = new T.OrthographicCamera(-20, 20, 20, -20, 0.1, 180);
    this.target = new T.Vector3(0, 0, 1);
    this.materials = new Map();
    this.actorMap = new Map();
    this.moneyMap = new Map();
    this.effects = [];
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.shoreFoam = [];
    this.floaters = [];
    this.waves = [];
    this.palms = [];
    this.overview = false;
    this.manual = false;
    this.tracking = false;
    this.zoomFactor = 1;
    this.labels = [];
    this.guide = document.createElement("div");
    this.guide.className = "world-guide";
    document.querySelector("#labels").append(this.guide);
    this.sleepLabels = ROOMS.map(() => {
      const el = document.createElement("div");
      el.className = "sleep-label";
      el.textContent = "z z z";
      document.querySelector("#labels").append(el);
      return el;
    });
    this.happyFace = document.createElement("div");
    this.happyFace.className = "guest-reaction";
    this.happyFace.textContent = "☺";
    this.happyFace.style.display = "none";
    document.querySelector("#labels").append(this.happyFace);
    this.roomGroups = [];
    this.poolGroup = new T.Group();
    this.dynamic = new T.Group();
    this.scene.add(this.dynamic);
    this.scene.add(new T.HemisphereLight(0xfff7df, 0x6eabb1, 1.8));
    const sun = new T.DirectionalLight(0xffedce, 2.5);
    sun.position.set(-16, 32, 17);
    sun.castShadow = true;
    const shadowSize = window.innerWidth < 650 ? 1024 : 2048;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 25,
      bottom: -25,
      near: 0.5,
      far: 85,
    });
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);
    this.makeWorld();
    this.player = this.character(0, true);
    this.scene.add(this.player);
    this.playerHalo = this.mesh(
      new T.RingGeometry(0.47, 0.54, 32),
      0xfff4c5,
      0,
      0.22,
      0,
    );
    this.playerHalo.rotation.x = -Math.PI / 2;
    this.playerHalo.visible = false;
    this.carried = new T.Group();
    this.carried.position.set(0, 1, 0.56);
    this.player.add(this.carried);
    this.cashBundles = Array.from({ length: 16 }, (_, i) =>
      this.coin(
        ((i % 2) - 0.5) * 0.47,
        Math.floor(i / 2) * 0.13,
        0,
        this.carried,
      ),
    );
    this.player.userData.mop = this.mop(this.player);
    this.cleanerActors = Array.from({ length: 3 }, () => {
      const a = this.character(4);
      a.userData.mop = this.mop(a);
      a.userData.luggage.visible = false;
      this.box(0.35, 0.4, 0.035, 0xe0edd5, 0, 0.79, 0.275, a);
      this.cyl(0.3, 0.3, 0.1, 0x89b2a8, 0, 1.86, 0, a);
      this.scene.add(a);
      return a;
    });
    this.runnerActors = Array.from({ length: 3 }, () => {
      const a = this.character(1);
      a.userData.luggage.visible = false;
      a.userData.cargo = new T.Group();
      a.add(a.userData.cargo);
      for (let j = 0; j < 6; j++)
        this.coin(0, 1 + j * 0.13, 0.5, a.userData.cargo);
      this.cyl(0.3, 0.3, 0.1, 0x75a9bd, 0, 1.86, 0, a);
      this.scene.add(a);
      return a;
    });
    this.roomMess = ROOMS.map((r, i) => {
      const group = new T.Group();
      group.position.set(r.x, 0, r.z);
      this.scene.add(group);
      for (let j = 0; j < 4; j++) {
        const towel = this.round(
          0.65,
          0.06,
          0.4,
          j % 2 ? 0xe1d4bd : 0xd0c7af,
          -1.2 + j * 0.8,
          0.32,
          2.5 - (j % 2) * 0.3,
          group,
          0.06,
        );
        towel.rotation.y = j * 0.7;
      }
      const blanket = this.round(
        2.7,
        0.06,
        0.9,
        0xabb2a0,
        0,
        1.25,
        0.9,
        group,
        0.08,
      );
      blanket.rotation.y = 0.15;
      for (let j = 0; j < 3; j++) {
        const dust = this.cyl(
          0.22,
          0.25,
          0.016,
          0xb8a88a,
          -2.2 + j * 0.3,
          0.24,
          0.4 + j * 0.4,
          group,
        );
        dust.scale.z = 0.6;
      }
      const spot = CLEAN_SPOTS[i],
        ring = this.mesh(
          new T.RingGeometry(0.72, 0.85, 40),
          0xd9a168,
          spot.x,
          0.32,
          spot.z,
        );
      ring.rotation.x = -Math.PI / 2;
      ring.material = new T.MeshBasicMaterial({ color: 0xd99948 });
      const marker = this.sign(
        "CLEAN",
        1.15,
        0.36,
        spot.x,
        0.325,
        spot.z,
        this.scene,
        "#f1d7a1",
        "#654b24",
        58,
      );
      marker.rotation.x = -Math.PI / 2;
      ring.add(marker);
      marker.position.set(0, 0, 0.005);
      marker.rotation.set(0, 0, 0);
      return { group, ring };
    });
    this.rebuild();
    this.resize();
  }
  addFurniture(name, parent, x, y, z, level = 1, theme = 0x6d998b) {
    const model = furniture(
      name,
      this.materials,
      (material) => {
        if (
          material.name.startsWith("Sea glass runner") ||
          material.name.startsWith("Sea glass upholstery")
        ) {
          material.color.setHex(theme);
        }
      },
      `${level}:${theme}`,
    );
    if (!model) return false;
    model.position.set(x, y, z);
    if (name === "boutique-bed" || name === "standard-single-bed")
      model.scale.set(1, 0.76, 0.9);
    parent.add(model);
    return model;
  }
  setDecor(id) {
    if (this.decor === id) return;
    this.decor = id;
    const palette = (DECOR.find((d) => d.id === id) || DECOR[0]).colors;
    for (const material of this.materials.values()) {
      const spec = material.userData.decor;
      if (spec) material.color.setHex(palette[spec.role] ?? spec.original);
    }
  }
  clothTexture() {
    if (this.weaveTexture) return this.weaveTexture;
    const pixels = new Uint8Array(32 * 32 * 4);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const i = (y * 32 + x) * 4,
          value = 145 + (x % 4 === 0 || y % 4 === 0 ? 30 : 0);
        pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
        pixels[i + 3] = 255;
      }
    const texture = new T.DataTexture(pixels, 32, 32);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(8, 8);
    texture.needsUpdate = true;
    return (this.weaveTexture = texture);
  }
  fabric(role, original) {
    return { role, original };
  }
  mat(color, roughness = 0.85) {
    if (typeof color === "object") {
      const key = `decor:${color.role}:${color.original}:${roughness}`;
      if (!this.materials.has(key)) {
        const palette = (DECOR.find((d) => d.id === this.decor) || DECOR[0])
          .colors;
        const material = new T.MeshStandardMaterial({
          color: palette[color.role] ?? color.original,
          roughness,
        });
        material.userData.decor = color;
        if (["linen", "carpet"].includes(color.role)) {
          material.bumpMap = this.clothTexture();
          material.bumpScale = 0.014;
          material.roughness = 0.95;
        }
        this.materials.set(key, material);
      }
      return this.materials.get(key);
    }
    const key = color + ":" + roughness;
    if (!this.materials.has(key))
      this.materials.set(key, new T.MeshStandardMaterial({ color, roughness }));
    return this.materials.get(key);
  }
  mesh(geo, color, x = 0, y = 0, z = 0, parent = this.scene) {
    const m = new T.Mesh(geo, this.mat(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  box(w, h, d, color, x, y, z, parent = this.scene) {
    return this.mesh(new T.BoxGeometry(w, h, d), color, x, y, z, parent);
  }
  round(w, h, d, color, x, y, z, parent = this.scene, r = 0.12) {
    const bevel = h > 0.08 ? Math.min(0.045, h * 0.18, w * 0.04, d * 0.04) : 0;
    const shape = new T.Shape(),
      hw = w / 2 - bevel,
      hd = d / 2 - bevel;
    r = Math.min(r, hw, hd);
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    const geo = new T.ExtrudeGeometry(shape, {
      depth: h - bevel * 2,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 2,
      curveSegments: 3,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -h / 2 + bevel, 0);
    return this.mesh(geo, color, x, y, z, parent);
  }
  sphere(r, c, x, y, z, p = this.scene) {
    return this.mesh(new T.SphereGeometry(r, 16, 10), c, x, y, z, p);
  }
  cyl(top, bottom, h, c, x, y, z, p = this.scene) {
    return this.mesh(new T.CylinderGeometry(top, bottom, h, 16), c, x, y, z, p);
  }
  sign(
    words,
    w,
    h,
    x,
    y,
    z,
    parent = this.scene,
    bg = "#2d6656",
    fg = "#fff2cb",
    font = 52,
  ) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = Math.max(64, Math.round((512 * h) / w));
    const a = c.getContext("2d");
    a.fillStyle = bg;
    a.fillRect(0, 0, c.width, c.height);
    a.fillStyle = fg;
    a.textAlign = "center";
    a.textBaseline = "middle";
    a.font = `600 ${Math.min(font, (c.height * 0.64) / words.split("\n").length)}px Georgia`;
    words
      .split("\n")
      .forEach((s, i, all) =>
        a.fillText(
          s,
          256,
          c.height / 2 + ((i - (all.length - 1) / 2) * c.height) / all.length,
          480,
        ),
      );
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    const m = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: tex }),
    );
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  plant(x, z, size = 1, parent = this.scene) {
    const model = this.addFurniture(
      "coastal-planter",
      parent,
      x,
      0,
      z,
      1,
      0x6ca777,
    );
    if (model) {
      model.scale.setScalar(size);
      return model;
    }
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(size);
    parent.add(g);
    this.cyl(0.3, 0.22, 0.5, 0xc97d58, 0, 0.25, 0, g);
    this.cyl(0.27, 0.27, 0.06, 0xe5a780, 0, 0.53, 0, g);
    for (let i = 0; i < 7; i++) {
      let a = i * 0.9;
      const leaf = this.sphere(
        0.25,
        i % 2 ? 0x4e9167 : 0x6ca777,
        Math.sin(a) * 0.25,
        0.8 + Math.cos(a) * 0.13,
        Math.cos(a) * 0.25,
        g,
      );
      leaf.scale.set(0.6, 1.7, 0.6);
      leaf.rotation.z = Math.sin(a) * 0.5;
    }
    return g;
  }
  palm(x, z, size = 1) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(size);
    this.scene.add(g);
    this.cyl(0.18, 0.3, 3.5, 0xae8353, 0, 1.5, 0, g);
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7,
        leaf = new T.Group();
      leaf.position.y = 3.15;
      leaf.rotation.y = a;
      g.add(leaf);
      const geo = new T.BufferGeometry(),
        v = [];
      for (let j = 0; j < 8; j++) {
        const a = j / 8,
          b = (j + 1) / 8,
          wa = 0.4 * Math.sin(a * Math.PI),
          wb = 0.4 * Math.sin(b * Math.PI),
          ya = Math.sin(a * Math.PI) * 0.55 - a * 0.5,
          yb = Math.sin(b * Math.PI) * 0.55 - b * 0.5;
        v.push(
          -wa,
          ya,
          a * 2.5,
          wa,
          ya,
          a * 2.5,
          -wb,
          yb,
          b * 2.5,
          wa,
          ya,
          a * 2.5,
          wb,
          yb,
          b * 2.5,
          -wb,
          yb,
          b * 2.5,
        );
      }
      geo.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      geo.computeVertexNormals();
      const mat = new T.MeshStandardMaterial({
        color: i % 2 ? 0x408565 : 0x589b6b,
        side: T.DoubleSide,
        roughness: 1,
      });
      const m = new T.Mesh(geo, mat);
      m.castShadow = true;
      leaf.add(m);
    }
    this.palms.push(g);
  }
  addSea() {
    this.box(64, 0.08, 160, 0x429eaf, -49, -1.12, 0);
    this.box(5, 0.09, 160, 0x6fc4c5, -19.5, -1.06, 0);
    for (let i = 0; i < 24; i++) {
      const foam = this.round(
        0.13,
        0.02,
        3.5 + (i % 3),
        0xc0eee1,
        -17.5 - (i % 3) * 0.65,
        -0.99,
        -65 + i * 5.7,
        this.scene,
        0.05,
      );
      this.shoreFoam.push({ mesh: foam, x: foam.position.x, phase: i * 0.7 });
      this.round(
        2 + (i % 4),
        0.02,
        0.08,
        0x88d4d4,
        -24 - (i % 5) * 4,
        -1,
        -60 + i * 5.4,
        this.scene,
        0.03,
      );
    }
    this.round(1.6, 0.35, 3.7, 0xfff1d4, -25, -0.7, 4, this.scene, 0.6);
    this.box(0.07, 2.5, 0.07, 0xb8865b, -25, 0.5, 4);
    const sail = this.mesh(new T.ConeGeometry(1, 2, 3), 0xffe9bc, -25, 0.8, 4);
    sail.scale.z = 0.08;
  }
  makeWorld() {
    const ground = this.box(160, 0.2, 160, 0x84cec9, 0, -1.3, 0);
    ground.receiveShadow = false;
    this.addSea();
    this.round(34, 0.35, 39, 0xe3ce9f, 0, -0.72, 1.5, this.scene, 4);
    this.round(31, 0.22, 36, 0xf1dbab, 0, -0.43, 1.5, this.scene, 3);
    this.round(25, 0.55, 29, 0xc19c70, 0, -0.22, 1, this.scene, 0.4);
    this.round(24.5, 0.12, 28.6, 0xf3e5c6, 0, 0.08, 1, this.scene, 0.4);
    if (
      !coverFloor(this, "lobby-limestone", this.scene, 0, 1, 24.5, 28.6, 0.135)
    ) {
      for (let z = -12.5; z < 15; z += 1.05)
        this.box(24, 0.012, 0.025, 0xe5d4b5, 0, 0.15, z);
      for (let x = -11.8; x < 12; x += 1.2)
        this.box(0.015, 0.013, 28, 0xebdabb, x, 0.15, 1);
    }
    if (
      !coverFloor(
        this,
        this.game.state.floor ? "upstairs-carpet" : "lobby-runner",
        this.scene,
        0,
        -3.1,
        5.1,
        17.2,
        0.17,
      )
    ) {
      this.round(
        5.5,
        0.035,
        17.2,
        this.fabric("border", this.game.state.floor ? 0x87749a : 0x4c988e),
        0,
        0.16,
        -3.1,
        this.scene,
        0.1,
      );
      this.round(
        5.1,
        0.015,
        16.7,
        this.fabric("carpet", this.game.state.floor ? 0xb9a8c6 : 0x72b4a0),
        0,
        0.19,
        -3.1,
        this.scene,
        0.1,
      );
      for (let z = -10.9; z < 5; z += 1.4)
        this.box(
          4.9,
          0.014,
          0.025,
          this.fabric("stripe", this.game.state.floor ? 0xd4c4df : 0x8bc5ad),
          0,
          0.202,
          z,
        );
    }
    this.backdrop = new T.Group();
    this.scene.add(this.backdrop);
    this.box(24.5, 2.7, 0.35, colors.cream, 0, 1.4, -13.1, this.backdrop);
    this.box(24.7, 0.16, 0.48, 0xe9c793, 0, 2.81, -13.1, this.backdrop);
    this.sign(
      this.game.state.floor ? "THE SKY SUITES" : "PALM HOUSE",
      6,
      1.1,
      0,
      1.9,
      -12.89,
      this.backdrop,
    );
    this.sign(
      "S E A S I D E   H O T E L",
      4.6,
      0.5,
      0,
      1,
      -12.88,
      this.backdrop,
      "#2d6656",
      "#f7dfa6",
      29,
    );
    for (const x of [-11.7, 11.7])
      for (const z of [-11.8, -4.5, 3.6]) this.plant(x, z, 1.3);
    // Reception, seating, rugs and entrance details.
    if (!this.game.state.floor) {
      this.round(4.6, 0.08, 3.6, 0xd9ab71, 0, 0.17, 10.3, this.scene, 0.6);
      for (let i = 0; i < 5; i++)
        this.cyl(0.055, 0.055, 0.65, 0xab8b55, -1.4, 0.48, 10 + i * 0.85);
      if (!this.addFurniture("reception-desk", this.scene, 0, 0.13, 7.65)) {
        this.round(4.4, 1.2, 1.3, 0x996d4d, 0, 0.8, 7.65, this.scene, 0.3);
        for (let x = -1.9; x < 2; x += 0.2)
          this.cyl(0.055, 0.055, 1.02, 0xc89969, x, 0.8, 8.29);
        this.round(4.7, 0.22, 1.55, 0xfff0d6, 0, 1.49, 7.65, this.scene, 0.3);
        this.sign(
          "RECEPTION",
          2.5,
          0.46,
          0,
          0.95,
          8.325,
          this.scene,
          "#315f51",
          "#fff3d0",
          54,
        );
        this.box(0.75, 0.55, 0.1, 0x315952, -0.85, 1.87, 7.53);
        this.box(0.8, 0.07, 0.4, 0x476558, -0.85, 1.63, 7.65);
        this.cyl(0.13, 0.17, 0.1, 0xe3b753, 1.45, 1.65, 7.7);
        this.sphere(0.14, 0xffd98a, 1.45, 1.72, 7.7);
        this.plant(-1.72, 7.6, 0.45).position.y = 1.6;
        this.round(
          0.57,
          0.045,
          0.38,
          0xbb8c67,
          0.45,
          1.62,
          7.8,
          this.scene,
          0.015,
        );
        this.round(
          0.49,
          0.015,
          0.33,
          0xfffae9,
          0.45,
          1.65,
          7.8,
          this.scene,
          0.006,
        );
      }
    }
    this.round(4.5, 0.1, 3.2, 0xd9c3a0, 7.8, 0.19, 9.5, this.scene, 0.5);
    this.round(4.5, 0.55, 1.2, 0xc87561, 7.8, 0.6, 8.7, this.scene, 0.2);
    this.round(4.5, 0.8, 0.3, 0xe8957a, 7.8, 1, 8.24, this.scene, 0.2);
    for (let x = 6.5; x < 10; x += 1.3)
      this.round(1.2, 0.2, 0.92, 0xf2ad8e, x, 0.94, 8.8, this.scene, 0.15);
    this.cyl(0.8, 0.8, 0.12, 0xeac491, 7.8, 0.75, 10.5);
    this.cyl(0.18, 0.28, 0.6, 0xab8359, 7.8, 0.43, 10.5);
    this.cyl(0.16, 0.16, 0.17, 0xffffff, 7.6, 0.9, 10.5);
    this.plant(10.9, 10.4, 1.35);
    for (const [x, z, s] of [
      [-14, 11, 1.2],
      [14, 13, 1.3],
      [-14, -9, 1.1],
      [14, -10, 1],
      [-13, 0, 0.9],
    ])
      this.palm(x, z, s);
    for (let i = 0; i < 12; i++) {
      const m = this.round(
        3 + (i % 3),
        0.025,
        0.12,
        0xb5e6db,
        -23 + (i % 3) * 4,
        -1.17,
        -18 + i * 4,
        this.scene,
        0.05,
      );
      m.castShadow = false;
      this.waves.push(m);
    }
    const cart = new T.Group();
    cart.position.set(-10, 0, 4.8);
    this.scene.add(cart);
    this.round(1.15, 0.65, 0.7, 0x7c9d92, 0, 0.6, 0, cart, 0.08);
    this.box(1.2, 0.06, 0.75, 0xead7b0, 0, 0.96, 0, cart);
    for (const z of [-0.22, 0.22])
      for (const x of [-0.4, 0.4]) this.sphere(0.12, 0x586b5c, x, 0.2, z, cart);
    for (let j = 0; j < 3; j++)
      this.round(
        0.65,
        0.11,
        0.4,
        0xf5edda,
        -0.1,
        1.05 + j * 0.11,
        0,
        cart,
        0.04,
      );
    this.serviceRing = this.mesh(
      new T.RingGeometry(0.85, 1.03, 48),
      0x75d6a2,
      0,
      0.33,
      5.8,
    );
    this.serviceRing.rotation.x = -Math.PI / 2;
    this.serviceRing.material = new T.MeshBasicMaterial({
      color: 0x7cddb0,
      side: T.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    this.cashRing = this.mesh(
      new T.RingGeometry(0.9, 1.02, 32),
      0xe7c15f,
      3.8,
      0.2,
      7.4,
    );
    this.cashRing.rotation.x = -Math.PI / 2;
    for (const pad of PADS) this.makePurchasePad(pad, 0.3);
  }
  makePurchasePad(pad, y) {
    const g = new T.Group();
    g.position.set(pad.x, y, pad.z);
    this.scene.add(g);
    const glow = this.round(2.12, 0.012, 2.12, 0xffdc7a, 0, -0.01, 0, g, 0.25);
    glow.material = new T.MeshBasicMaterial({
      color: 0xffdc7a,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    glow.castShadow = false;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(
      8,
      this.renderer.capabilities.getMaxAnisotropy(),
    );
    const material = new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const surface = new T.Mesh(new T.PlaneGeometry(1.9, 1.9), material);
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.025;
    g.add(surface);
    this.labels.push({ pad, g, glow, canvas, texture, key: "" });
  }
  drawPurchasePad(entry, title, amount, progress, detail, active) {
    const key = [title, amount, Math.round(progress * 20), detail, active].join(
      "|",
    );
    if (key === entry.key) return;
    entry.key = key;
    const c = entry.canvas.getContext("2d");
    c.clearRect(0, 0, 512, 512);
    c.fillStyle = active ? "#376e59" : "#d9bd70";
    c.beginPath();
    c.roundRect(8, 8, 496, 496, 54);
    c.fill();
    c.strokeStyle = active ? "#effbdc" : "#fff2bf";
    c.lineWidth = 9;
    c.beginPath();
    c.roundRect(20, 20, 472, 472, 44);
    c.stroke();
    c.textAlign = "center";
    c.fillStyle = active ? "#fff8dd" : "#254e43";
    c.font = "bold 56px sans-serif";
    const words = title.toUpperCase().split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (c.measureText(next).width > 434 && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((t, i) => c.fillText(t, 256, 82 + i * 61));
    c.font = "bold 98px sans-serif";
    c.fillText(amount, 256, 316);
    c.font = "bold 35px sans-serif";
    const phrase = detail.split(" · ")[0];
    const words2 = phrase.split(" ");
    const lines2 = [];
    let line2 = "";
    for (const word of words2) {
      const next = line2 ? line2 + " " + word : word;
      if (c.measureText(next).width > 430 && line2) {
        lines2.push(line2);
        line2 = word;
      } else line2 = next;
    }
    if (line2) lines2.push(line2);
    lines2.slice(0, 2).forEach((t, i) => c.fillText(t, 256, 370 + i * 41));
    c.fillStyle = "#fff0bd";
    c.fillRect(52, 442, 408, 14);
    c.fillStyle = "#579371";
    c.fillRect(52, 442, 408 * Math.min(1, progress), 14);
    entry.texture.needsUpdate = true;
  }

  disposeGroup(group) {
    const removed = new Set();
    group.traverse((o) => {
      removed.add(o);
      if (o.geometry) o.geometry.dispose();
      if (o.material?.map) {
        o.material.map.dispose();
        o.material.dispose();
      }
    });
    group.removeFromParent();
    this.palms = this.palms.filter((p) => !removed.has(p));
  }
  rebuild() {
    for (const group of this.roomGroups) this.disposeGroup(group);
    this.roomGroups = [];
    for (let i = 0; i < roomCount(this.game.state); i++) this.buildRoom(i);
    this.backdrop.position.z = cafeOffset(this.game.state);
    this.backdrop.visible = true;
    if (this.extension) this.disposeGroup(this.extension);
    this.extension = new T.Group();
    this.scene.add(this.extension);
    const ext = this.extension;
    this.round(31, 0.2, 9, 0xf1dbab, 0, -0.43, -20, ext, 1);
    if (this.game.state.expanded) {
      this.box(25, 0.55, 7.5, 0xc19c70, 0, -0.22, -16.75, ext);
      this.box(24.5, 0.12, 7.5, 0xf3e5c6, 0, 0.08, -16.75, ext);
      if (
        !coverFloor(this, "lobby-limestone", ext, 0, -16.75, 24.5, 7.5, 0.135)
      )
        for (let z = -20; z < -13; z += 1.05)
          this.box(24, 0.012, 0.025, 0xe5d4b5, 0, 0.15, z, ext);
      if (
        !coverFloor(
          this,
          this.game.state.floor ? "upstairs-carpet" : "lobby-runner",
          ext,
          0,
          -16,
          5.1,
          8.6,
          0.17,
        )
      ) {
        this.round(
          5.5,
          0.035,
          8.8,
          this.fabric("border", 0x4c988e),
          0,
          0.16,
          -16.1,
          ext,
          0.1,
        );
        this.round(
          5.1,
          0.02,
          8.4,
          this.fabric("carpet", 0x72b4a0),
          0,
          0.19,
          -16.1,
          ext,
          0.1,
        );
      }
      this.sign(
        "GARDEN WING",
        4,
        0.6,
        0,
        0.23,
        -18.6,
        ext,
        "#72b4a0",
        "#2d6656",
        47,
      ).rotation.x = -Math.PI / 2;
      this.plant(-11.3, -19.3, 1.2, ext);
      this.plant(11.3, -19.3, 1.2, ext);
    } else {
      this.box(24, 0.06, 7.2, 0xd6c8a4, 0, -0.28, -16.9, ext);
      for (const x of [-10, -5, 0, 5, 10]) {
        this.box(0.15, 1.1, 0.15, 0xb88d5b, x, 0.35, -20.1, ext);
        this.box(4.9, 0.15, 0.12, 0xe9d1a1, x, 0.66, -20.1, ext);
      }
      this.sign(
        "GARDEN WING · TWO NEW ROOMS",
        10,
        1.1,
        0,
        0.1,
        -17.4,
        ext,
        "#d6c8a4",
        "#8d805f",
        31,
      ).rotation.x = -Math.PI / 2;
    }
    if (this.width) this.setFrustum();
    if (this.facilities) this.disposeGroup(this.facilities);
    this.facilities = new T.Group();
    this.scene.add(this.facilities);
    const s = this.game.state,
      p = this.facilities;
    if (!s.floor) {
      if (s.barMenu)
        this.sign(
          "DRINKS +" + s.barMenu * 15,
          2,
          0.6,
          -7.8,
          1.9,
          11,
          p,
          "#244d4b",
          "#fff2cb",
          35,
        );
      if (s.bakery) {
        this.round(
          1.15,
          0.2,
          0.65,
          0xe2bb79,
          0.9,
          1.65,
          -11.1 + cafeOffset(s),
          p,
          0.1,
        );
        for (let n = 0; n < 5; n++)
          this.cyl(
            0.11,
            0.14,
            0.12,
            0xc48145,
            0.5 + n * 0.2,
            1.8,
            -11.1 + cafeOffset(s),
            p,
          );
      }
    }
    if (s.minibar)
      for (let i = 0; i < roomCount(s); i++) {
        if (!s.levels[i]) continue;
        const r = ROOMS[i];
        this.box(0.6, 0.8, 0.55, 0x53766a, r.x + 2.4, 0.65, r.z - 2, p);
        this.box(0.4, 0.55, 0.025, 0xdbe8ce, r.x + 2.4, 0.65, r.z - 1.71, p);
      }
    if (s.floor) {
      this.extension.visible = this.game.state.expanded;
      this.sign(
        "FLOOR 2 · THE SKY SUITES",
        6,
        0.65,
        0,
        0.3,
        -10.6,
        p,
        "#e5d4b5",
        "#695c80",
        35,
      ).rotation.x = -Math.PI / 2;
    }
    if (s.wing) {
      this.round(31, 0.2, 12.5, 0xf1dbab, 0, -0.43, -26.25, p, 1);
      this.box(25, 0.55, 10, 0xc19c70, 0, -0.22, -25.5, p);
      this.box(24.5, 0.12, 10, 0xf3e5c6, 0, 0.08, -25.5, p);
      if (!coverFloor(this, "lobby-limestone", p, 0, -25.5, 24.5, 10, 0.135))
        for (let z = -30; z < -20; z += 1.05)
          this.box(24, 0.012, 0.025, 0xe5d4b5, 0, 0.15, z, p);
      if (
        !coverFloor(
          this,
          s.floor ? "upstairs-carpet" : "lobby-runner",
          p,
          0,
          -25.3,
          5.1,
          10,
          0.17,
        )
      ) {
        this.round(
          5.5,
          0.035,
          11.3,
          this.fabric("border", 0x4c988e),
          0,
          0.16,
          -24.85,
          p,
          0.1,
        );
        this.round(
          5.1,
          0.02,
          10.9,
          this.fabric("carpet", 0x72b4a0),
          0,
          0.19,
          -24.85,
          p,
          0.1,
        );
      }
      // A low divider separates the two locked north rooms, leaving the hall open.
      for (const x of [-7.65, 7.65]) {
        this.round(8.2, 0.6, 0.38, 0xd2ba8e, x, 0.5, -22.35, p, 0.12);
        this.round(8.3, 0.1, 0.46, 0xffefd2, x, 0.85, -22.35, p, 0.12);
      }
      for (const x of [-3.4, 3.4])
        this.box(0.25, 1.3, 0.35, 0xd2ba8e, x, 0.8, -22.35, p);
      this.sign(
        "NORTH ROOMS",
        3,
        0.5,
        0,
        0.24,
        -21.5,
        p,
        "#72b4a0",
        "#2d6656",
        48,
      ).rotation.x = -Math.PI / 2;
      this.plant(-11.3, -29.3, 1.2, p);
      this.plant(11.3, -29.3, 1.2, p);
      this.round(8, 0.025, 1.8, 0xb5c8ae, 7.1, 0.2, -21, p, 0.1);
      if (!s.gym) {
        for (const z of [-22, -20])
          this.box(0.2, 1.1, 0.2, 0xb89360, 11.8, 0.65, z, p);
        this.box(0.15, 0.2, 2.1, 0xe9d1a1, 11.8, 1, -21, p);
        this.sign(
          "GYM →",
          2.2,
          0.55,
          9.8,
          0.24,
          -20.5,
          p,
          "#b5c8ae",
          "#426455",
          54,
        ).rotation.x = -Math.PI / 2;
      }
    }
    if (s.gym) {
      this.round(5, 0.13, 2, 0xb5c8ae, 13.5, 0.12, -21, p, 0.1);
      this.round(19, 0.5, 18, 0xc19c70, 24, -0.23, -21.5, p, 0.5);
      this.round(18.8, 0.12, 17.8, 0xf3e5c6, 24, 0.08, -21.5, p, 0.4);
      this.round(3, 0.04, 5, 0xb5c8ae, 16.5, 0.18, -12.5, p, 0.1);
      this.box(18.8, 1.7, 0.25, 0xd7e6cb, 24, 0.98, -30.3, p);
      this.sign("PALM WELLNESS · GUEST GYM", 10, 0.85, 24, 1.45, -30.1, p);
      for (let i = 0; i < (s.gymUpgrade ? 6 : 3); i++) {
        const x = 20 + (i % 3) * 4,
          z = -19 - Math.floor(i / 3) * 5;
        this.round(3.3, 0.04, 4, 0xb5c8ae, x, 0.2, z, p, 0.25);
        if (!this.addFurniture("treadmill", p, x, 0.2, z)) {
          this.round(1.7, 0.25, 2.7, 0x55786e, x, 0.4, z, p, 0.15);
          this.round(1.3, 0.04, 2.3, 0x344b48, x, 0.55, z, p, 0.08);
          for (const side of [-0.7, 0.7])
            this.box(0.09, 1.1, 0.09, 0xc8d7c6, x + side, 1, z - 0.9, p);
          this.box(1.5, 0.35, 0.25, 0x436658, x, 1.5, z - 0.9, p);
          this.box(0.6, 0.18, 0.03, 0xa8d4c7, x, 1.53, z - 0.75, p);
        }
      }
      this.sign(
        "$" + (s.gymUpgrade ? 65 : 40) + " / WORKOUT",
        5,
        0.55,
        24,
        0.23,
        -15,
        p,
        "#f3e5c6",
        "#497563",
        48,
      ).rotation.x = -Math.PI / 2;
      this.plant(16, -28.5, 1.2, p);
      this.plant(32, -28.5, 1.2, p);
    }
    this.serverActors = [];
    if (s.restaurantPlot) {
      const dining = new T.Group();
      dining.position.x = 4;
      p.add(dining);
      this.round(19, 0.5, 19.4, 0xc19c70, 20, -0.23, -3, dining, 0.35);
      this.round(18.8, 0.12, 19.2, 0xf3e5c6, 20, 0.08, -3, dining, 0.3);
      this.round(15, 0.08, 2.4, 0xa6bf9a, 18, 0.2, 4.7, p, 0.1);
      this.box(
        s.gym ? 14.8 : 18.8,
        1.7,
        0.25,
        0xfff3d7,
        s.gym ? 22 : 20,
        0.98,
        -12.55,
        dining,
      );
      this.sign("PALM KITCHEN", 5, 0.65, 23, 1.45, -12.35, dining);
      this.plant(28, -11.7, 1.1, dining);
      if (s.restaurant) {
        this.round(6.6, 0.07, 12.5, 0xe3b08d, 24, 0.22, -5, dining, 0.4);
        const serviceCounter = this.addFurniture(
          "service-counter",
          dining,
          20,
          0.2,
          -6,
        );
        if (serviceCounter) serviceCounter.rotation.y = Math.PI / 2;
        else {
          this.round(1.3, 1, 5, 0x9f7255, 20, 0.7, -6, dining, 0.16);
          this.round(1.5, 0.13, 5.2, 0xffe7bc, 20, 1.28, -6, dining, 0.14);
        }
        for (let slot = 0; slot < (s.diningExpansion ? 6 : 3); slot++) {
          const x = 22 + (slot % 3) * 2,
            z = -3 - Math.floor(slot / 3) * 5;
          if (
            !this.addFurniture("dining-set", dining, x, 0.2, z, 1, 0xa7b18a)
          ) {
            this.cyl(0.7, 0.7, 0.13, 0xf6e0b4, x, 0.95, z, dining);
            this.cyl(0.12, 0.23, 0.7, 0x9c7655, x, 0.55, z, dining);
            for (const seat of [-1.3, 1.3])
              this.round(
                0.8,
                0.4,
                0.7,
                0xa7b18a,
                x,
                0.5,
                z + seat,
                dining,
                0.12,
              );
            this.cyl(0.16, 0.16, 0.04, 0xffffff, x, 1.04, z, dining);
          }
        }
        for (let k = 0; k < s.servers; k++) {
          const actor = this.character(4);
          actor.userData.luggage.visible = false;
          const tray = new T.Group();
          this.cyl(0.31, 0.31, 0.045, 0xc8ae79, 0, 1.05, 0.43, tray);
          this.cyl(0.19, 0.19, 0.028, 0xfff5df, 0, 1.085, 0.43, tray);
          this.sphere(0.09, 0x8da77b, -0.06, 1.12, 0.43, tray);
          actor.add(tray);
          actor.userData.servingTray = tray;
          tray.visible = false;
          p.add(actor);
          actor.position.set(22, 0, -6 + k * 1.2);
          this.serverActors.push(actor);
        }
        const serve = this.mesh(
          new T.RingGeometry(0.8, 1, 40),
          0x7cddb0,
          18.4,
          0.23,
          -4,
          dining,
        );
        serve.rotation.x = -Math.PI / 2;
        this.sign(
          "SERVE DINNER",
          2.4,
          0.45,
          18.4,
          0.27,
          -4,
          dining,
          "#d8e7ba",
          "#446f59",
          30,
        ).rotation.x = -Math.PI / 2;
        for (let k = 0; k < s.kitchen; k++)
          this.box(0.55, 0.5, 0.8, 0xa6b7aa, 20, 1.5, -7 + k * 1.2, dining);
      } else
        for (const x of [22, 24, 26])
          this.box(1, 0.7, 1, 0xc59d71, x, 0.55, -5, dining);
    }
    if (s.extraDesk) {
      for (let x = -4.05; x < -2.5; x += 0.2)
        this.cyl(0.05, 0.05, 1.02, 0xc89969, x, 0.8, 8.29, p);
      this.round(1.8, 1.2, 1.3, 0x996d4d, -3.3, 0.8, 7.65, p, 0.2);
      this.round(1.9, 0.15, 1.5, 0xfff0d6, -3.3, 1.5, 7.65, p, 0.2);
      this.box(0.65, 0.5, 0.12, 0x315952, -3.3, 1.8, 7.55, p);
    }
    if (s.elevator || s.floor) {
      this.box(2.1, 2.8, 0.25, 0x8c9c98, 3.2, 1.5, 11.4, p);
      this.box(1.65, 2.35, 0.28, 0xc4d4cf, 3.2, 1.27, 11.6, p);
      this.box(0.045, 2.35, 0.3, 0x647b74, 3.2, 1.27, 11.8, p);
      this.sign(
        s.floor ? "01 ↓ LOBBY" : "02 ↑ SUITES",
        2,
        0.4,
        3.2,
        2.8,
        11.85,
        p,
        "#365f55",
        "#fff0c9",
        28,
      );
      this.round(2.1, 0.035, 1.5, 0xadcbb8, 3.2, 0.2, 12.8, p, 0.2);
    }
    if (s.floor) {
      this.sign(
        "LAUNDRY",
        3,
        0.5,
        -7.9,
        0.3,
        8,
        p,
        "#ddcba7",
        "#6b756c",
        35,
      ).rotation.x = -Math.PI / 2;
      if (s.laundry)
        for (const x of [-9, -7]) {
          this.round(1.6, 1.4, 1.3, 0xfff5df, x, 0.9, 9.3, p, 0.12);
          const door = this.cyl(0.48, 0.48, 0.08, 0x6f9da6, x, 0.95, 10, p);
          door.rotation.x = Math.PI / 2;
        }
      if (s.lounge) {
        const lounge = new T.Group();
        lounge.position.z = cafeOffset(s);
        p.add(lounge);
        this.round(3.7, 0.45, 1.4, 0xb4a1c7, 0, 0.5, -10.5, lounge, 0.2);
        this.round(3.7, 0.7, 0.3, 0x9a86af, 0, 0.9, -11, lounge, 0.1);
        this.round(1.3, 0.2, 0.9, 0xe0bb7e, 0, 0.65, -9, lounge, 0.15);
        this.plant(2, -10.5, 1, lounge);
      }
    }
    if (s.pool) {
      this.round(6.3, 0.08, 5.6, 0xe9cda5, -7.9, 0.23, 9.3, p, 0.4);
      const lobbyBar = this.addFurniture("bar-counter", p, -7.9, 0.2, 10.5);
      if (lobbyBar) lobbyBar.rotation.y = Math.PI;
      else {
        this.round(5.2, 1.05, 1.25, 0x976343, -7.9, 0.78, 10.5, p, 0.18);
        this.round(5.5, 0.16, 1.5, 0xffedc9, -7.9, 1.38, 10.5, p, 0.16);
        for (const x of [-9.5, -7.9, -6.3]) {
          this.cyl(0.12, 0.16, 0.75, 0x6c6550, x, 0.65, 8.8, p);
          this.cyl(0.38, 0.38, 0.15, 0x729b81, x, 1.06, 8.8, p);
          this.cyl(0.09, 0.08, 0.25, 0xe8b15c, x, 1.6, 10.05, p);
        }
        for (let i = 0; i < 5; i++) {
          this.cyl(
            0.075,
            0.085,
            0.36,
            i % 2 ? 0x537f65 : 0xc78651,
            -9.4 + i * 0.32,
            1.66,
            10.8,
            p,
          );
        }
      }
      this.plant(-10.6, 11.6, 0.9, p);
      this.sign(
        "PALM BAR",
        3,
        0.6,
        -7.8,
        0.6,
        12.25,
        p,
        "#f5deae",
        "#3b897c",
        42,
      );
    } else if (!s.floor) {
      this.round(6.1, 0.06, 5.5, 0xddcba7, -7.9, 0.19, 9.3, p, 0.4);
      for (let z = 7; z < 12; z += 0.6)
        this.box(5.7, 0.012, 0.025, 0xd0bc98, -7.9, 0.23, z, p);
      this.sign(
        "PALM BAR",
        4,
        0.7,
        -7.9,
        0.3,
        7,
        p,
        "#ddcba7",
        "#9b8c6f",
        40,
      ).rotation.x = -Math.PI / 2;
      this.plant(-10.6, 6.6, 1, p);
    }
    if (s.desk && !s.floor) {
      this.box(3.7, 0.08, 0.25, 0xeec360, 0, 1.64, 8.21, p);
      this.sign(
        "★ PREMIUM SERVICE ★",
        2.7,
        0.3,
        0,
        1.22,
        8.34,
        p,
        "#c58b57",
        "#ffefb1",
        28,
      );
    }
    if (s.cafe) {
      const coffee = new T.Group();
      coffee.position.z = cafeOffset(s);
      p.add(coffee);
      if (!this.addFurniture("cafe-counter", coffee, 0, 0.15, -11)) {
        this.round(3.4, 1, 1.4, 0xb98256, 0, 0.72, -11, coffee, 0.18);
        this.round(3.6, 0.15, 1.6, 0xffe5b0, 0, 1.3, -11, coffee, 0.2);
        this.round(0.85, 0.65, 0.55, 0x3c6661, -0.85, 1.68, -11, coffee, 0.1);
        this.cyl(0.22, 0.22, 0.4, 0xd5d8c2, 0.15, 1.57, -11, coffee);
        for (const x of [0.7, 1.15]) {
          this.cyl(0.13, 0.13, 0.18, 0xfff9e5, x, 1.48, -10.8, coffee);
          this.cyl(0.17, 0.17, 0.04, 0xe3ba6d, x, 1.38, -10.8, coffee);
        }
      }
      this.sign(
        "SUNRISE COFFEE",
        2.8,
        0.4,
        0,
        0.99,
        -10.28,
        coffee,
        "#b98256",
        "#ffedc7",
        37,
      );
    }
    this.receptionActors = [];
    for (let k = 0; k < staffCount(s, "receptionist"); k++) {
      const a = this.character(1, false);
      this.receptionActors.push(a);
      a.position.set(
        s.extraDesk && k === 1 ? -3.3 : -0.4 + (k === 2 ? 1.35 : k * 1.35),
        0,
        5.9,
      );
      a.rotation.y = 0;
      p.add(a);
    }
  }
  buildRoom(i) {
    const s = this.game.state,
      r = ROOMS[i],
      lv = s.levels[i],
      g = new T.Group();
    g.position.set(r.x, 0, r.z);
    this.scene.add(g);
    this.roomGroups.push(g);
    const theme = [0x6faaa2, 0xdc9b8a, 0x8ba97c, 0xcba269, 0xb3a0c5, 0x86ad8d][
      i % 6
    ];
    this.box(7.35, 0.045, 6.9, lv ? 0xe7d5b4 : 0xd1c9b4, 0, 0.19, 0, g);
    for (let z = -3; z < 3.4; z += 0.65)
      this.box(7.3, 0.009, 0.017, lv ? 0xd5c09d : 0xc7bea8, 0, 0.22, z, g);
    if (lv) coverFloor(this, "bedroom-oak-floor", g, 0, 0, 7.35, 6.9, 0.225);
    if (
      !placeArchitecture(
        this,
        "bedroom-panel-wall",
        g,
        0,
        0.2,
        -3.3,
        7.6,
        0,
        1.3,
      )
    ) {
      this.box(
        7.6,
        1.65,
        0.24,
        lv ? this.fabric("wall", theme) : 0xb8c5ae,
        0,
        0.97,
        -3.3,
        g,
      );
      this.box(7.65, 0.14, 0.32, colors.cream, 0, 1.85, -3.3, g);
    }
    // Complete the room enclosure, keeping the corridor doorway as its only opening.
    // Low cutaway walls match the side panels and keep guests visible from above.
    if (
      !placeArchitecture(
        this,
        "bedroom-panel-wall",
        g,
        0,
        0.2,
        3.4,
        7.8,
        Math.PI,
        0.8,
      )
    ) {
      this.box(7.8, 0.9, 0.24, this.fabric("wall", theme), 0, 0.65, 3.4, g);
      this.box(7.85, 0.12, 0.35, colors.cream, 0, 1.15, 3.4, g);
    }
    const outside = Math.sign(r.x) * 3.9;
    if (
      !placeArchitecture(
        this,
        "bedroom-panel-wall",
        g,
        outside,
        0.2,
        0.05,
        6.7,
        Math.PI / 2,
        0.8,
      )
    ) {
      this.box(
        0.24,
        0.9,
        6.7,
        this.fabric("wall", theme),
        outside,
        0.65,
        0.05,
        g,
      );
      this.box(0.35, 0.12, 6.7, colors.cream, outside, 1.15, 0.05, g);
    }
    const edge = i % 2 === 0 ? 3.65 : -3.65;
    if (
      !placeArchitecture(
        this,
        "bedroom-panel-wall",
        g,
        edge,
        0.2,
        -1.5,
        3.6,
        Math.PI / 2,
        0.8,
      )
    ) {
      this.box(0.24, 0.9, 3.6, 0xf1e6cc, edge, 0.65, -1.5, g);
      this.box(0.24, 0.9, 1.2, 0xf1e6cc, edge, 0.65, 2.75, g);
      this.box(0.35, 0.12, 3.6, 0xfff5df, edge, 1.15, -1.5, g);
      this.box(0.35, 0.12, 1.2, 0xfff5df, edge, 1.15, 2.75, g);
    } else {
      placeArchitecture(
        this,
        "bedroom-panel-wall",
        g,
        edge,
        0.2,
        2.75,
        1.2,
        Math.PI / 2,
        0.8,
      );
    }
    this.sign(
      (this.game.state.floor ? "2" : "0") + (i + 1),
      0.9,
      0.5,
      -2.6,
      1.28,
      -3.15,
      g,
      lv ? "#48776c" : "#9ea992",
      "#ffefca",
      79,
    );
    if (!lv) {
      this.box(1.15, 0.7, 1, 0xc49e72, -0.9, 0.57, -0.6, g);
      this.box(0.95, 0.8, 0.8, 0xd5b485, -0.3, 0.65, 0.4, g);
      this.box(0.15, 0.015, 1.01, 0xf4dab0, -0.9, 0.93, -0.6, g);
      this.box(0.97, 0.02, 0.12, 0xf4dab0, -0.3, 1.06, 0.4, g);
      this.sign(
        "YOUR NEXT\nGREAT ROOM",
        3,
        1.2,
        0,
        0.25,
        1.75,
        g,
        "#d1c9b4",
        "#8e927d",
        37,
      ).rotation.x = -Math.PI / 2;
      return;
    }
    this.sign(
      `$${roomRate(this.game.state, i)} / night`,
      3.5,
      0.62,
      0.5,
      1.3,
      -3.12,
      g,
      "#e7e7ce",
      "#426455",
      64,
    );
    this.round(
      4.9,
      0.04,
      4.3,
      lv === 2 ? 0xe5bf7f : 0xc1cdb0,
      0,
      0.25,
      0.2,
      g,
      0.3,
    );
    if (
      !this.addFurniture(
        lv === 1 ? "standard-single-bed" : "boutique-bed",
        g,
        0,
        0.27,
        0.1,
        lv,
        theme,
      )
    ) {
      const fallbackBed = new T.Group();
      fallbackBed.scale.x = lv === 1 ? 0.56 : 1;
      g.add(fallbackBed);
      this.round(3.4, 0.52, 3.8, 0xad8055, 0, 0.56, 0.1, fallbackBed, 0.2);
      this.round(3.5, 0.75, 0.27, theme, 0, 1.12, -1.75, fallbackBed, 0.12);
      for (let x = -1.45; x < 1.5; x += 0.48)
        this.round(
          0.025,
          0.57,
          0.018,
          0xb6c9af,
          x,
          1.12,
          -1.598,
          fallbackBed,
          0.005,
        );
      this.round(3.3, 0.28, 3.65, 0xfff9e9, 0, 0.91, 0.13, fallbackBed, 0.22);
      this.round(
        3.34,
        0.13,
        3.15,
        0xf4ead7,
        0,
        1.075,
        0.38,
        fallbackBed,
        0.055,
      );
      this.round(3.34, 0.12, 1.25, theme, 0, 1.19, 1.05, fallbackBed, 0.12);
      for (const x of lv === 1 ? [0] : [-0.78, 0.78]) {
        this.round(
          1.3,
          0.25,
          0.73,
          0xfffcf0,
          x,
          1.14,
          -1.12,
          fallbackBed,
          0.22,
        );
        this.round(0.55, 0.19, 0.55, theme, x, 1.3, -0.71, fallbackBed, 0.12);
      }
      this.box(3.33, 0.04, 0.23, theme, 0, 1.23, 1.25, fallbackBed);
    }
    for (const x of [-2.6, 2.6]) {
      if (this.addFurniture("bedside-lamp", g, x, 0.22, -1.27)) continue;
      this.round(0.95, 0.7, 0.82, 0xc09565, x, 0.63, -1.27, g, 0.1);
      this.cyl(0.09, 0.15, 0.38, 0xb59659, x, 1.11, -1.27, g);
      this.cyl(0.28, 0.38, 0.4, 0xffedb8, x, 1.45, -1.27, g);
    }
    this.round(0.82, 0.76, 0.07, 0xc7a36f, 2.8, 1.22, -3.13, g, 0.025);
    this.round(0.69, 0.63, 0.025, 0xfff4dc, 2.8, 1.22, -3.081, g, 0.01);
    for (let k = 0; k < 3; k++) {
      const leaf = this.sphere(
        0.12,
        0x6c9680,
        2.8 + Math.sin(k * 2) * 0.13,
        1.04 + k * 0.16,
        -3.06,
        g,
      );
      leaf.scale.set(1, 0.45, 0.12);
      leaf.rotation.z = k * 0.6;
    }
    this.plant(Math.sign(r.x) * 2.85, -2.6, 0.8, g);
    const chairX = Math.sign(r.x) * 2.6;
    if (
      !this.addFurniture("seaside-armchair", g, chairX, 0.2, 2.3, lv, theme)
    ) {
      this.round(
        1.1,
        0.22,
        1.1,
        lv === 2 ? 0xd8a676 : 0x9aaf83,
        chairX,
        0.6,
        2.3,
        g,
        0.25,
      );
      this.round(
        1.15,
        0.55,
        0.3,
        lv === 2 ? 0xd8a676 : 0x9aaf83,
        chairX,
        0.88,
        1.85,
        g,
        0.12,
      );
    }
    if (lv === 2) {
      this.sign("✦", 0.6, 0.5, 0, 1.34, -3.13, g, "#48776c", "#f4d48a", 75);
      this.round(1.1, 0.15, 0.7, 0xfff0cf, 0, 1.31, 0.5, g, 0.1);
      this.cyl(0.12, 0.12, 0.17, 0xfffefa, -0.22, 1.46, 0.5, g);
      this.cyl(0.15, 0.15, 0.04, 0xd6a955, 0.2, 1.4, 0.5, g);
    }
  }
  mop(parent) {
    const tool = new T.Group();
    parent.add(tool);
    tool.position.set(0.42, 0, 0.3);
    const handle = this.cyl(0.035, 0.035, 1.25, 0xc19a68, 0, 0.75, 0.2, tool);
    handle.rotation.x = -0.25;
    this.round(0.65, 0.1, 0.32, 0xb2c8bd, 0, 0.16, 0.36, tool, 0.05);
    tool.visible = false;
    return tool;
  }
  character(color, player = false) {
    const g = new T.Group(),
      shirt = player
        ? 0xfff4d8
        : [0xe09675, 0x75a9bd, 0xe9c368, 0x9890b9, 0x8da77b][color % 5],
      skin = [0xdbaa7f, 0xbd8059, 0xefd0a5, 0x98684e][color % 4];
    g.userData.seed = color + (player ? 19 : 0);
    const torso = this.mesh(
      new T.CapsuleGeometry(0.27, 0.2, 4, 12),
      shirt,
      0,
      0.9,
      0,
      g,
    );
    g.userData.torso = torso;
    this.cyl(0.12, 0.13, 0.16, skin, 0, 1.27, 0, g);
    this.cyl(0.15, 0.19, 0.07, player ? 0xfff4d8 : shirt, 0, 1.23, 0, g);
    this.sphere(0.3, skin, 0, 1.5, 0, g);
    const hair = this.sphere(
      0.305,
      player ? 0x654d39 : 0x453a36,
      0,
      1.64,
      -0.045,
      g,
    );
    hair.scale.y = 0.57;
    for (const x of [-0.11, 0.11]) {
      this.sphere(0.032, 0x343d35, x, 1.54, 0.273, g);
      if (player) this.sphere(0.01, 0xfff9ed, x - 0.008, 1.55, 0.299, g);
    }
    this.sphere(0.052, skin, 0, 1.48, 0.292, g);
    for (const x of [-0.29, 0.29]) this.sphere(0.061, skin, x, 1.5, 0, g);
    const smile = this.mesh(
      new T.TorusGeometry(0.055, 0.009, 5, 10, Math.PI),
      0x815441,
      0,
      1.4,
      0.28,
      g,
    );
    smile.rotation.z = Math.PI;
    if (player) {
      const sweep = this.sphere(0.18, 0x654d39, -0.12, 1.73, 0.12, g);
      sweep.scale.set(1.2, 0.45, 0.85);
      sweep.rotation.z = -0.2;
    }
    const legs = [],
      knees = [],
      arms = [],
      elbows = [],
      shoes = [];
    for (const x of [-0.15, 0.15]) {
      const leg = new T.Group();
      leg.position.set(x, 0.54, 0);
      g.add(leg);
      this.mesh(
        new T.CapsuleGeometry(0.095, 0.11, 4, 10),
        player ? 0x426c60 : 0x4c5964,
        0,
        -0.11,
        0,
        leg,
      );
      const knee = new T.Group();
      knee.position.y = -0.24;
      leg.add(knee);
      this.mesh(
        new T.CapsuleGeometry(0.082, 0.1, 4, 10),
        player ? 0x426c60 : 0x4c5964,
        0,
        -0.08,
        0,
        knee,
      );
      knees.push(knee);
      legs.push(leg);
      shoes.push(
        this.round(0.22, 0.14, 0.33, 0x534637, 0, -0.17, 0.045, knee, 0.06),
      );
      const arm = new T.Group();
      arm.position.set(x * 2.2, 1.15, 0);
      g.add(arm);
      this.cyl(0.085, 0.09, 0.2, shirt, 0, -0.09, 0, arm);
      const elbow = new T.Group();
      elbow.position.y = -0.21;
      arm.add(elbow);
      this.sphere(0.074, skin, 0, 0, 0, elbow);
      this.cyl(0.07, 0.075, 0.2, skin, 0, -0.1, 0, elbow);
      this.sphere(0.077, skin, 0, -0.26, 0, elbow);
      elbows.push(elbow);
      arm.rotation.z = x < 0 ? -0.12 : 0.12;
      arms.push(arm);
    }
    if (player) {
      this.round(0.43, 0.44, 0.055, 0x3d7769, 0, 0.79, 0.262, g, 0.022);
      this.box(0.06, 0.07, 0.03, 0xeec77d, 0.13, 1.09, 0.25, g);
      this.cyl(0.29, 0.29, 0.13, 0xfff4d8, 0, 1.88, 0, g);
      this.cyl(0.34, 0.34, 0.04, 0xf7d787, 0, 1.83, 0.01, g);
      const arrow = this.mesh(
        new T.ConeGeometry(0.12, 0.25, 3),
        0xfff4ce,
        0,
        2.4,
        0,
        g,
      );
      arrow.rotation.z = Math.PI;
      g.userData.arrow = arrow;
    } else {
      const luggage = new T.Group();
      g.add(luggage);
      g.userData.luggage = luggage;
      this.round(
        0.34,
        0.5,
        0.3,
        [0xc38752, 0x78908f, 0x9e715b][color % 3],
        0.5,
        0.38,
        0,
        luggage,
        0.06,
      );
      this.box(0.2, 0.13, 0.05, 0x8a704e, 0.5, 0.72, 0, luggage);
      for (const x of [0.4, 0.6])
        this.sphere(0.055, 0x534637, x, 0.11, 0, luggage);
      const cup = new T.Group();
      g.add(cup);
      this.cyl(0.12, 0.1, 0.2, 0xfff3dd, -0.37, 1.05, 0.28, cup);
      this.cyl(0.1, 0.1, 0.012, 0x805536, -0.37, 1.16, 0.28, cup);
      cup.visible = false;
      g.userData.cup = cup;
      const float = this.mesh(
        new T.TorusGeometry(0.48, 0.13, 8, 24),
        0xf1c36e,
        0,
        0.73,
        0,
        g,
      );
      float.rotation.x = Math.PI / 2;
      float.visible = false;
      g.userData.float = float;
    }
    g.userData.legs = legs;
    g.userData.knees = knees;
    g.userData.arms = arms;
    g.userData.elbows = elbows;
    g.userData.shoes = shoes;
    return g;
  }
  coin(x, y, z, parent = this.scene) {
    const g = new T.Group();
    g.position.set(x, y, z);
    parent.add(g);
    this.round(0.57, 0.12, 0.32, 0x559b65, 0, 0, 0, g, 0.03);
    this.round(0.55, 0.02, 0.31, 0x8ec982, 0, 0.075, 0, g, 0.03);
    this.box(0.09, 0.025, 0.32, 0xf3e4a6, 0, 0.085, 0, g);
    return g;
  }
  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.playerOverlay.setSize(this.width, this.height, false);
    this.aspect = this.width / this.height;
    this.mobile = this.aspect < 0.8;
    this.setFrustum();
  }
  setFrustum() {
    let span = this.mobile
      ? this.overview
        ? 48
        : 23
      : this.overview
        ? 36
        : 32;
    if (
      this.game.state.expanded &&
      (this.overview || (!this.mobile && !this.tracking))
    )
      span += 8;
    if (this.aspect > 1.9) span = this.game.state.expanded ? 38 : 29;
    if (this.game.state.wing && this.overview) span += 12;
    if (this.game.state.restaurantPlot && this.overview) span += 8;
    if (this.game.state.gym && this.overview) span += 14;
    if (this.overview)
      span = Math.max(
        span,
        (this.game.state.restaurantPlot ? 54 : 32) / this.aspect,
      );
    span /= this.zoomFactor;
    this.camera.left = (-span * this.aspect) / 2;
    this.camera.right = (span * this.aspect) / 2;
    this.camera.top = span / 2;
    this.camera.bottom = -span / 2;
    this.camera.updateProjectionMatrix();
  }
  setZoom(value) {
    this.zoomFactor = Math.max(0.6, Math.min(2.8, value));
    this.setFrustum();
  }
  followPlayer() {
    this.manual = false;
    if (!this.tracking || this.overview) {
      this.tracking = true;
      this.overview = false;
      this.setFrustum();
    }
  }
  pan(dx, dy) {
    this.manual = true;
    const units = (this.camera.top - this.camera.bottom) / this.height;
    this.target.x = Math.max(
      -18,
      Math.min(
        this.game.state.restaurantPlot ? 39 : 18,
        this.target.x - dx * units,
      ),
    );
    this.target.z = Math.max(
      this.game.state.gym
        ? -46
        : this.game.state.wing
          ? -34
          : this.game.state.expanded
            ? -25
            : -18,
      Math.min(21, this.target.z - (dy * units) / 0.8),
    );
  }
  project(x, y, z) {
    const v = new T.Vector3(x, y, z).project(this.camera);
    return {
      x: ((v.x + 1) / 2) * this.width,
      y: ((1 - v.y) / 2) * this.height,
      visible: v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2,
    };
  }
  event(e) {
    if (e.type === "build") {
      this.rebuild();
      const palette = [0xf4c569, 0xfff5d5, 0x76b69b, 0xe69c7d];
      for (let i = 0; i < (this.reducedMotion ? 0 : 22); i++) {
        const m = this.box(0.12, 0.07, 0.16, palette[i % 4], e.x, 0.4, e.z);
        this.effects.push({
          m,
          life: 1.5,
          max: 1.5,
          vx: (Math.random() - 0.5) * 6,
          vy: 4 + Math.random() * 5,
          vz: (Math.random() - 0.5) * 6,
        });
      }
    }
    if (e.type === "clean") {
      for (let i = 0; i < (this.reducedMotion ? 0 : 10); i++) {
        const m = this.sphere(0.055 + (i % 3) * 0.018, 0xd9f5e3, e.x, 0.5, e.z);
        this.effects.push({
          m,
          life: 0.8,
          max: 0.8,
          vx: (Math.random() - 0.5) * 2,
          vy: 3 + Math.random() * 2,
          vz: (Math.random() - 0.5) * 2,
        });
      }
    }
    if (
      e.type === "collect" ||
      e.type === "tip" ||
      e.type === "runnerCollect"
    ) {
      const el = document.createElement("div");
      el.className = "float-text";
      el.textContent = "+$" + e.value;
      document.querySelector("#labels").append(el);
      this.floaters.push({ el, x: e.x, z: e.z, life: 1.2 });
      for (let i = 0; i < (e.type === "collect" ? 4 : 0); i++) {
        const m = this.coin(e.x, 0.4 + i * 0.15, e.z);
        this.effects.push({ m, life: 0.5, max: 0.5, toPlayer: true });
      }
    }
    if (e.type === "spend") {
      const p = this.game.player,
        m = this.coin(
          p.x + Math.sin(p.angle) * 0.55,
          1.1,
          p.z + Math.cos(p.angle) * 0.55,
        );
      this.effects.push({
        m,
        life: 0.3,
        max: 0.3,
        target: { x: e.x, y: 0.22, z: e.z },
      });
    }
  }
  updateRestoration() {
    if (this.game.state.floor) return;
    const count = this.game.restorationCount || 0;
    if (!count && !this.restorationDisplay) return;
    if (!this.restorationDisplay) {
      const group = new T.Group();
      this.scene.add(group);
      this.restorationDisplay = group;
      this.box(8, 0.055, 0.055, 0xd0ad70, 0, 2.7, 14, group);
      for (const x of [-4, 4])
        this.box(0.1, 2.8, 0.1, 0xd0ad70, x, 1.4, 14, group);
      this.restorationFlags = [];
      for (let i = 0; i < 7; i++) {
        const flag = this.box(
          0.6,
          0.55,
          0.035,
          [0x72b4a0, 0xe2bc6e, 0xdc9b8a][i % 3],
          -3 + i,
          2.38,
          14,
          group,
        );
        this.restorationFlags.push(flag);
      }
      this.openingPlaque = this.sign(
        "GRAND OPENING",
        3.2,
        0.55,
        -7,
        1.6,
        12,
        group,
      );
    }
    this.restorationDisplay.visible = count > 0;
    this.restorationFlags.forEach((flag, i) => (flag.visible = i < count));
    this.openingPlaque.visible = count === 7;
  }
  render(dt) {
    this.updateRestoration();
    const g = this.game,
      s = g.state;
    let targetX =
        (this.mobile || this.tracking) && !this.overview
          ? g.player.x
          : this.overview && s.restaurantPlot
            ? 10
            : 0,
      targetZ =
        (this.mobile || this.tracking) && !this.overview
          ? g.player.z - 1
          : s.gym
            ? -7
            : s.wing
              ? -7
              : s.expanded
                ? -2.8
                : 1;
    if (!this.manual)
      this.target.lerp(
        new T.Vector3(targetX, 0, targetZ),
        1 - Math.exp(-dt * 4),
      );
    this.camera.position.set(
      this.target.x,
      this.target.y + 32,
      this.target.z + 24,
    );
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
    this.player.position.set(g.player.x, 0, g.player.z);
    this.playerHalo.position.set(g.player.x, 0.22, g.player.z);
    this.player.rotation.y = g.player.angle;
    this.animateActor(this.player, g.player, dt);
    const carrying = s.cash > 0 && g.cleanRoom < 0;
    this.carried.visible = carrying;
    const bundleCount = Math.min(8, Math.ceil(s.cash / 100));
    this.cashBundles.forEach((b, i) => (b.visible = i < bundleCount));
    this.carried.rotation.z = g.player.moving
      ? Math.sin(g.time * 8) * 0.025
      : 0;
    this.player.userData.arms.forEach((a) => {
      if (carrying) a.rotation.x = -1.1;
    });
    if (g.cleanRoom >= 0) this.cleaningPose(this.player);
    this.player.userData.mop.visible = g.cleanRoom >= 0;
    this.player.userData.mop.rotation.y = Math.sin(g.time * 10) * 0.4;
    this.receptionActors?.forEach((actor, i) => {
      this.animateActor(actor, { moving: false, angle: actor.rotation.y }, dt);
      const working =
        onDuty(s) &&
        (s.extraDesk && i === 1 ? g.secondService > 0 : g.service > 0);
      actor.userData.arms.forEach(
        (arm, j) =>
          (arm.rotation.x = working
            ? -0.65 + Math.sin(g.time * 7 + j) * 0.12
            : 0),
      );
    });
    this.cleanerActors.forEach((a, i) => {
      const worker = g.cleaners[i];
      a.visible = i < staffCount(s, "cleaner");
      a.position.set(worker.x, 0, worker.z);
      a.rotation.y = worker.angle;
      this.animateActor(a, worker, dt);
      if (worker.phase === "clean" && onDuty(s)) this.cleaningPose(a);

      a.userData.mop.visible = true;
      a.userData.mop.rotation.y =
        worker.phase === "clean" && onDuty(s)
          ? Math.sin(g.time * 10 * workRate(s)) * 0.4
          : 0;
    });
    this.runnerActors.forEach((a, i) => {
      const runner = g.runners[i];
      a.visible = i < staffCount(s, "runner");
      a.position.set(runner.x, 0, runner.z);
      a.rotation.y = runner.angle;
      this.animateActor(a, runner, dt);
      a.userData.cargo.visible = runner.cargo > 0;
      a.userData.arms.forEach((arm) => {
        if (runner.cargo > 0) arm.rotation.x = -1.1;
      });
    });
    this.roomMess.forEach((a, i) => {
      a.group.visible = s.dirty[i];
      a.ring.visible = s.dirty[i];
      a.ring.material.color.setHex(g.cleanRoom === i ? 0x64b988 : 0xd99948);
    });
    if (this.player.userData.arrow)
      this.player.userData.arrow.position.y = 2.35 + Math.sin(g.time * 3) * 0.1;
    const smiling = g.guests.find(
      (v) => v.happyUntil > g.time && v.phase !== "stay",
    );
    this.happyFace.style.display = smiling ? "block" : "none";
    if (smiling) {
      const at = this.project(smiling.x, 2.9, smiling.z);
      this.happyFace.style.left = at.x + "px";
      this.happyFace.style.top = at.y + "px";
      this.happyFace.style.opacity = Math.min(
        0.85,
        (smiling.happyUntil - g.time) * 1.8,
      );
      if (!at.visible || at.y < 140 || at.y > this.height - 120)
        this.happyFace.style.display = "none";
    }
    for (const [i, actor] of (this.serverActors || []).entries()) {
      const guest = g.guests.find((v) => v.id === g.servingIds?.[i]);
      const target = new T.Vector3(
        guest ? guest.x : 22,
        0,
        guest ? guest.z + 0.6 : -6 + i * 1.2,
      );
      const dx = target.x - actor.position.x,
        dz = target.z - actor.position.z;
      actor.position.lerp(target, Math.min(1, dt * 2));
      actor.rotation.y = Math.atan2(dx, dz);
      this.animateActor(actor, { moving: Math.hypot(dx, dz) > 0.1 }, dt);
      actor.userData.cup.visible = false;
      actor.userData.servingTray.visible = !!guest;
      actor.userData.arms.forEach((arm, index) => {
        arm.rotation.x = guest
          ? -0.8 + (index ? 0 : Math.sin(g.time * 4) * 0.08)
          : 0;
      });
    }
    const ids = new Set();
    for (const guest of g.guests) {
      ids.add(guest.id);
      let a = this.actorMap.get(guest.id);
      if (!a) {
        a = this.character(guest.color);
        this.scene.add(a);
        this.actorMap.set(guest.id, a);
      }
      a.visible = ![
        "stay",
        "waitingLift",
        "transitUp",
        "transitDown",
        "gone",
      ].includes(guest.phase);
      a.position.set(guest.x, 0, guest.z);
      a.rotation.y = guest.angle;
      this.animateActor(a, guest, dt);
      const coffee = [
        "cafe",
        "restaurant",
        "pool",
        "roofDrink",
        "skyLounge",
        "restaurantEating",
      ].includes(guest.phase);
      a.userData.luggage.visible = [
        "queue",
        "room",
        "exit",
        "leavingRoom",
        "toLift",
        "fromLift",
      ].includes(guest.phase);
      a.userData.cup.visible = coffee;
      a.userData.float.visible = false;
      a.userData.legs.forEach((l) => (l.visible = true));
      a.userData.shoes.forEach((l) => (l.visible = true));
      if (guest.phase === "roofSwim") {
        a.position.y = -0.15 + Math.sin(g.time * 2 + guest.id) * 0.04;
        a.userData.float.visible = true;
        a.userData.luggage.visible = false;
        a.userData.legs.forEach((l) => (l.visible = false));
        a.userData.shoes.forEach((l) => (l.visible = false));
      }
      if (guest.phase === "gym") {
        a.position.y = 0.2 + Math.abs(Math.sin(g.time * 8 + guest.id)) * 0.08;
        a.userData.legs.forEach(
          (leg, j) =>
            (leg.rotation.x = Math.sin(g.time * 8 + j * Math.PI) * 0.35),
        );
        a.userData.arms.forEach(
          (arm, j) =>
            (arm.rotation.x = Math.sin(g.time * 8 + j * Math.PI) * 0.25 - 0.3),
        );
        a.userData.knees.forEach(
          (knee, j) =>
            (knee.rotation.x =
              Math.max(0, Math.sin(g.time * 8 + j * Math.PI)) * 0.6),
        );
        a.userData.luggage.visible = false;
      }
      if (coffee) {
        const sip = Math.pow(Math.max(0, Math.sin(g.time * 1.4 + guest.id)), 4);
        a.userData.cup.position.y = 0.04 + sip * 0.3;
        a.userData.cup.position.z = sip * 0.06;
        a.userData.cup.rotation.x = -0.2 * sip;
        a.userData.arms[0].rotation.x = -0.8 - sip * 0.4;
      }
    }
    for (const [id, a] of this.actorMap)
      if (!ids.has(id)) {
        this.disposeGroup(a);
        this.actorMap.delete(id);
      }
    const cashIds = new Set();
    for (const c of g.piles) {
      cashIds.add(c.id);
      let a = this.moneyMap.get(c.id);
      if (!a) {
        a = new T.Group();
        this.scene.add(a);
        for (let i = 0; i < 3; i++) this.coin(0, i * 0.1, 0, a);
        this.moneyMap.set(c.id, a);
      }
      a.position.set(c.x, 0.35 + Math.sin(g.time * 2 + c.id) * 0.035, c.z);
    }
    for (const [id, a] of this.moneyMap)
      if (!cashIds.has(id)) {
        this.disposeGroup(a);
        this.moneyMap.delete(id);
      }
    this.sleepLabels.forEach((el, i) => {
      const occupied = g.guests.some((v) => v.room === i && v.phase === "stay"),
        r = ROOMS[i],
        pt = this.project(r.x, 1.6 + Math.sin(g.time * 2) * 0.08, r.z - 0.5);
      el.style.display =
        (occupied || s.dirty[i] || s.bookingsPaused[i]) &&
        pt.visible &&
        pt.y > 150 &&
        pt.y < this.height - 120
          ? "block"
          : "none";
      el.textContent = s.dirty[i]
        ? s.cleaning[i] > 0
          ? "Cleaning " + Math.round(s.cleaning[i] * 100) + "%"
          : "Needs a clean"
        : occupied
          ? "z z z"
          : "Bookings paused";
      el.classList.toggle("dirty", s.dirty[i]);
      el.style.left = pt.x + "px";
      el.style.top = pt.y + "px";
    });
    this.serviceRing.visible = !s.floor;
    this.cashRing.visible = !s.floor && g.piles.length > 0;
    this.serviceRing.scale.setScalar(1 + Math.sin(g.time * 3) * 0.055);
    this.serviceRing.material.color.set(g.service > 0 ? 0xc5f79b : 0x7cddb0);

    let playerOverlapsCard = false;
    const compact = this.width <= 600;
    for (const entry of this.labels) {
      const { g: group, glow } = entry;
      const pad = padPosition(s, entry.pad);
      group.position.x = pad.x;
      group.position.z = pad.z;
      const visible = unlocked(s, pad.i) && !complete(s, pad.i);
      group.visible = visible;
      if (!visible) continue;
      const active = g.active === pad.i;
      glow.material.opacity = this.reducedMotion
        ? 0.22
        : (active ? 0.32 : 0.2) + Math.sin(g.time * 2 + pad.i * 0.3) * 0.07;
      const preview = s.openingDemo && pad.i === 10;
      const detail = ROLE_BY_PAD[pad.i]
        ? "$" + nextWage(s, ROLE_BY_PAD[pad.i]) + "/min wages"
        : benefit(s, pad.i) || "";
      this.drawPurchasePad(
        entry,
        preview ? "Beyond the lobby" : label(s, pad.i),
        preview ? "Preview" : "$" + Math.ceil(price(s, pad.i) - s.paid[pad.i]),
        preview ? 0 : s.paid[pad.i] / price(s, pad.i),
        detail,
        active,
      );
    }
    for (const e of this.effects) {
      e.life -= dt;
      if (e.toPlayer || e.target) {
        e.origin ??= e.m.position.clone();
        const target = e.target || { x: g.player.x, y: 1, z: g.player.z };
        const progress = Math.min(1, Math.max(0, 1 - e.life / e.max));
        const eased = 1 - Math.pow(1 - progress, 2);
        e.m.position.set(
          e.origin.x + (target.x - e.origin.x) * eased,
          e.origin.y +
            (target.y - e.origin.y) * eased +
            (this.reducedMotion ? 0 : Math.sin(progress * Math.PI) * 0.45),
          e.origin.z + (target.z - e.origin.z) * eased,
        );
      } else {
        e.vy -= 12 * dt;
        e.m.position.x += e.vx * dt;
        e.m.position.y += e.vy * dt;
        e.m.position.z += e.vz * dt;
        e.m.rotation.x += dt * 3;
        e.m.rotation.z += dt * 4;
      }
      e.m.scale.setScalar(Math.max(0.01, Math.min(1, e.life * 4)));
    }
    for (const e of this.effects.filter((e) => e.life <= 0))
      this.disposeGroup(e.m);
    this.effects = this.effects.filter((e) => e.life > 0);
    for (const f of this.floaters) {
      f.life -= dt;
      const a = this.project(f.x, 1 + (1.2 - f.life) * 1.6, f.z);
      f.el.style.left = a.x + "px";
      f.el.style.top = a.y + "px";
      f.el.style.opacity = Math.min(1, f.life * 2);
    }
    for (const f of this.floaters.filter((f) => f.life <= 0)) f.el.remove();
    this.floaters = this.floaters.filter((f) => f.life > 0);
    for (const foam of this.shoreFoam) {
      const tide = this.reducedMotion
        ? 0
        : Math.sin(g.time * 0.55 + foam.phase);
      foam.mesh.position.x = foam.x + tide * 0.22;
      foam.mesh.scale.z = 1 + tide * 0.08;
    }
    this.palms.forEach(
      (p, i) => (p.rotation.z = Math.sin(g.time * 0.6 + i) * 0.017),
    );
    this.waves.forEach((m, i) => {
      m.userData.baseX ??= m.position.x;
      m.position.x =
        m.userData.baseX +
        (this.reducedMotion ? 0 : Math.sin(g.time * 0.65 + i) * 0.12);
    });
    if (this.floatRing) {
      this.floatRing.position.y = 0.61 + Math.sin(g.time * 1.6) * 0.07;
      this.floatRing.rotation.z = Math.sin(g.time) * 0.1;
    }
    let destination = s.floor ? { x: 3.2, z: 12.8 } : RECEPTION,
      guideText = s.floor ? "Elevator to lobby" : "Welcome guests";
    const dirtyRoom = s.dirty.findIndex(Boolean);
    if (dirtyRoom >= 0 && (!s.cleaner || !onDuty(s))) {
      destination = CLEAN_SPOTS[dirtyRoom];
      guideText = "Clean room";
    } else if (g.piles.length) {
      destination = g.piles[0];
      guideText = "Collect cash";
    } else if (s.cash >= 100) {
      const next = PADS.map((p) => padPosition(s, p))
        .sort(
          (a, b) => price(s, a.i) - s.paid[a.i] - (price(s, b.i) - s.paid[b.i]),
        )
        .find(
          (a) =>
            unlocked(s, a.i) &&
            !complete(s, a.i) &&
            s.cash >= price(s, a.i) - s.paid[a.i],
        );
      if (next) {
        destination = next;
        guideText = label(s, next.i);
      }
    }
    if (s.openingDemo && g.openingGuide) {
      destination = g.openingGuide.destination;
      guideText = g.openingGuide.guide;
    }
    const pt = this.project(destination.x, 0.3, destination.z),
      far = distance(g.player, destination) > 2.5,
      offscreen =
        pt.x < 35 ||
        pt.x > this.width - 35 ||
        pt.y < 160 ||
        pt.y > this.height - 145;
    this.guide.style.display =
      far && offscreen && this.mobile && !this.overview ? "flex" : "none";
    this.guide.style.left =
      Math.max(66, Math.min(this.width - 66, pt.x)) + "px";
    this.guide.style.top =
      Math.max(175, Math.min(this.height - 158, pt.y)) + "px";
    this.guide.textContent =
      (pt.y < 160
        ? "↑ "
        : pt.y > this.height - 145
          ? "↓ "
          : pt.x < 35
            ? "← "
            : "→ ") + guideText;
    this.renderer.render(this.scene, this.camera);
    this.playerOverlay.domElement.style.display = playerOverlapsCard
      ? "block"
      : "none";
    if (playerOverlapsCard) {
      this.player.traverse((object) => object.layers.enable(1));
      this.scene.traverse((object) => {
        if (object.isLight) object.layers.enable(1);
      });
      const background = this.scene.background;
      this.scene.background = null;
      this.camera.layers.set(1);
      this.playerOverlay.render(this.scene, this.camera);
      this.camera.layers.set(0);
      this.scene.background = background;
    }
  }
  dispose() {
    const materials = new Set(this.materials.values()),
      textures = new Set();
    this.scene.traverse((object) => {
      object.geometry?.dispose();
      object.shadow?.map?.dispose();
      object.shadow?.mapPass?.dispose();
      if (object.material)
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
    });
    for (const material of materials) {
      if (material.map) textures.add(material.map);
      if (material.bumpMap) textures.add(material.bumpMap);
      material.dispose();
    }
    for (const texture of textures) texture.dispose();
    this.materials.clear();
    this.renderer.dispose();
    this.playerOverlay.dispose();
    document.querySelector("#labels").replaceChildren();
  }
  cleaningPose(actor) {
    const scrub = Math.sin(this.game.time * 7);
    actor.userData.arms.forEach(
      (arm, i) => (arm.rotation.x = -0.55 + scrub * (i ? 0.1 : 0.22)),
    );
    actor.position.y = this.reducedMotion ? 0 : 0.012 * (1 + scrub);
    actor.rotation.x = 0.1;
    actor.userData.elbows?.forEach((elbow) => (elbow.rotation.x = -0.2));
  }
  animateActor(a, v, dt = 0.016) {
    const state = stepMotion(
      a.userData.motion,
      {
        x: a.position.x,
        z: a.position.z,
        angle: v.angle ?? a.rotation.y,
        moving: v.moving,
      },
      dt,
      a.userData.seed,
      this.reducedMotion,
    );
    a.userData.motion = state;
    const pose = motionPose(state, this.game.time);
    a.rotation.y = state.angle;
    a.rotation.x = pose.lean;
    a.position.y = pose.bob;
    a.userData.torso.scale.y = pose.breath;
    a.userData.legs.forEach(
      (leg, i) => (leg.rotation.x = pose.leg * (i ? 1 : -1)),
    );
    a.userData.arms.forEach(
      (arm, i) => (arm.rotation.x = pose.arm * (i ? 1 : -1)),
    );
    a.userData.knees?.forEach((knee, i) => {
      knee.rotation.x =
        Math.max(0, Math.sin(state.stride + i * Math.PI)) * state.speed * 0.55;
    });
    a.userData.elbows?.forEach((elbow, i) => {
      elbow.rotation.x =
        -Math.max(0, Math.sin(state.stride + i * Math.PI)) * state.speed * 0.25;
    });
    if (a.userData.luggage) {
      a.userData.luggage.rotation.x = pose.leg * 0.12;
      if (a.userData.luggage.visible) a.userData.arms[1].rotation.x = -0.15;
    }
  }
}
