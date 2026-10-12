import * as T from "./vendor/three.module.js?v=5c2d59b334f77ae1";
import { PROJECTS, level } from "./resort.js?v=5c2d59b334f77ae1";
export function buildResort(v, p) {
  const s = v.game.state;
  const surface = s.floor === 2 ? 0.34 : 0.14;
  const floor = (x, z, w, d, color) =>
    v.round(w, 0.16, d, color, x, surface, z, p, 0.3);
  const sign = (text, x, z, w = 5) =>
    (v.sign(
      text,
      w,
      0.5,
      x,
      surface + 0.12,
      z,
      p,
      "#eadbb8",
      "#285c53",
      36,
    ).rotation.x = -Math.PI / 2);
  const seat = (x, z, c = 0xa2b9a0) => {
    v.round(1.3, 0.35, 1.15, c, x, 0.55, z, p, 0.18);
    v.round(1.3, 0.65, 0.18, c, x, 0.95, z - 0.5, p, 0.1);
  };
  const table = (x, z) => {
    v.cyl(0.55, 0.55, 0.12, 0xf6e6bf, x, 1, z, p);
    v.cyl(0.07, 0.07, 0.75, 0xb58a52, x, 0.58, z, p);
  };
  const asset = (name, x, z, scale = 1) => {
    const a = v.addFurniture(name, p, x, surface + 0.11, z);
    if (a) a.scale.setScalar(scale);
    return a;
  };
  v.resortRings = [];
  v.resortCars = [];
  if (!s.floor && s.expanded) {
    floor(15, 10, 8, 3, 0xd9c7a1);
    floor(0, 17, 23, 6, 0xe8d6ae);
    if (!level(s, "garage")) sign("PARKING →", 15.5, 8.6, 4);
    if (!level(s, "garden")) sign("TEA GARDEN", 1, 19.2, 4);
  }
  if (!s.floor && level(s, "garage")) {
    floor(24, 15.5, 19, 16, 0xabbab0);
    v.box(18.8, 1.1, 0.25, 0x71948b, 24, 0.8, 23.4, p);
    sign("PALM VALET · PARK & RELAX", 24, 21.5, 11);
    for (const x of [15.5, 32.5])
      v.box(0.18, 2.8, 0.18, 0x68887e, x, 1.6, 22.5, p);
    v.round(17.5, 0.12, 1.2, 0xe6d3a8, 24, 3.05, 22.5, p, 0.1);
    v.round(1.6, 1, 1, 0xe3b97c, 21, 0.8, 9, p, 0.15);
    for (let i = 0; i < 3; i++) {
      const x = 19 + i * 5;
      floor(x, 16, 3.5, 6, 0x829c93);
      sign("P" + (i + 1), x, 12.1, 0.9);
      for (const dx of [-1.8, 1.8])
        v.box(0.06, 0.02, 6, 0xf7edcf, x + dx, 0.25, 16, p);
      const car = asset("resort-car", x, 16, 1);
      if (car) v.resortCars.push(car);
      if (level(s, "garage") > 1) {
        v.round(0.65, 1.4, 0.5, 0x335c55, x, 0.9, 19.5, p, 0.1);
        v.box(0.32, 0.3, 0.03, 0x95d5bc, x, 1.2, 19.23, p);
      }
    }
  }
  if (!s.floor && level(s, "garden")) {
    floor(0, 23.5, 23, 15, 0x9fbc89);
    floor(0, 23, 4, 14, 0xe7d4a7);
    for (const x of [-10, 10])
      for (const z of [19, 24, 29]) v.plant(x, z, 1, p);
    for (const x of [-6, 6]) {
      floor(x, 25, 6, 6, 0xd5c49c);
      seat(x, 25.8);
      table(x, 24.5);
    }
    v.round(2.8, 0.8, 1, 0xdbb076, 0, 0.65, 24, p, 0.15);
    sign("THE TEA GARDEN", 0, 28.5, 8);
    if (level(s, "garden") > 1) {
      v.cyl(1.15, 1.25, 0.45, 0xe4d9be, 6, 0.45, 20, p);
      v.cyl(0.92, 0.92, 0.05, 0x70c6c1, 6, 0.71, 20, p);
      v.cyl(0.2, 0.4, 1.1, 0xf0e4cc, 6, 1.1, 20, p);
    }
  }
  if (!s.floor && level(s, "luggage")) {
    for (let n = 0; n < 2 + level(s, "luggage"); n++)
      v.round(
        0.52,
        0.75,
        0.42,
        [0xc98667, 0x66958b, 0xd4b362][n % 3],
        -10 + n * 0.65,
        0.62,
        19,
        p,
        0.1,
      );
    asset("service-trolley", -7.4, 19.3, 0.8);
  }
  if (!s.floor && level(s, "excursions")) {
    v.round(2.3, 0.9, 0.7, 0xb5996d, 7, 0.75, 3.2, p, 0.12);
    v.sign("SEASIDE OUTINGS", 2.5, 0.48, 7, 1.7, 2.9, p);
    v.box(0.7, 0.4, 0.05, 0x6ab6b4, 7, 1.25, 2.8, p);
  }
  if (!s.floor && level(s, "desserts")) asset("dessert-display", 29, 1.3, 1);
  if (!s.floor && level(s, "chef")) {
    v.round(2.5, 0.8, 1.1, 0xe1c69b, 18, 0.7, -11, p, 0.1);
    for (const x of [17.4, 18.5])
      v.cyl(0.3, 0.3, 0.08, 0x355950, x, 1.17, -11, p);
  }
  if (!s.floor && level(s, "weights")) {
    asset("weight-bench", 20, -19, 1);
    asset("exercise-bike", 24, -19, 1);
  }
  if (!s.floor && level(s, "yoga"))
    for (let i = 0; i < 2; i++) floor(28, -19 - i * 5, 1.6, 2.5, 0xc3a2a0);
  if (s.floor === 1 && s.lounge) {
    floor(13.5, 4.7, 5, 2.8, 0xd3c6b5);
    floor(24, -1, 19, 14, 0xdcccb8);
    v.box(19, 1.3, 0.22, 0x97aeb2, 24, 0.85, -8.1, p);
    v.sign("THE SKY PARLOUR", 7, 0.65, 20, 2.05, -8, p);
    if (level(s, "roomService")) {
      v.round(4, 1, 1.3, 0xc7b592, 20, 0.8, -5.7, p, 0.16);
      // A working pantry: plates, a sink and preparation space.
      v.box(1.2, 0.08, 0.65, 0x688f88, 19, 1.34, -5.7, p);
      v.cyl(0.04, 0.04, 0.5, 0xd7ba80, 19, 1.6, -6, p);
      for (let n = 0; n < 4; n++)
        v.cyl(0.28, 0.28, 0.055, 0xfff0ce, 21, 1.34 + n * 0.055, -5.7, p);
      v.round(0.6, 0.7, 0.5, 0x517c70, 20.7, 1.7, -5.85, p, 0.07);
      asset("service-trolley", 20, 2, 0.9);
      sign("ROOM SERVICE", 19, -2, 5);
    }
    if (level(s, "skyCafe")) {
      for (const x of [26.5, 29.5]) {
        seat(x, -2);
        table(x, -3.3);
      }
      v.box(5, 1.9, 0.4, 0xad8960, 28, 1.15, -7.2, p);
      for (let i = 0; i < 14; i++)
        v.box(
          0.16,
          0.45,
          0.3,
          [0x587e73, 0xdd9c7f, 0xe0c776][i % 3],
          26 + i * 0.28,
          1.6,
          -6.95,
          p,
        );
      v.round(2.6, 1, 1.1, 0xd4ad7a, 24, 0.8, 2, p, 0.15);
      for (let n = 0; n < 11; n++)
        v.box(0.055, 0.75, 0.025, 0xbc905e, 22.8 + n * 0.23, 0.78, 2.57, p);
      v.round(0.8, 0.65, 0.5, 0x3a675f, 23.5, 1.65, 2, p, 0.08);
      v.cyl(0.14, 0.14, 0.18, 0xf9e7ba, 24.5, 1.41, 2, p);
      v.cyl(0.14, 0.14, 0.18, 0xf9e7ba, 24.9, 1.41, 2, p);
      v.plant(32, -6, 0.6, p);
      for (const x of [26.5, 29.5])
        v.box(0.35, 0.035, 0.46, 0x70978a, x, 1.08, -3.3, p);
      sign("COFFEE & A GOOD BOOK", 27.5, 0.4, 6);
    }
  }
  if (s.floor === 2) {
    if (level(s, "cabanas")) {
      for (const x of [-8, -5.3]) asset("garden-cabana", x, 3, 1);
      sign("PRIVATE CABANAS", -6, 6.8, 5);
    }
    if (level(s, "sunset")) {
      floor(7, 6, 7, 5.5, 0xba9470);
      for (const x of [5.5, 8.4]) {
        seat(x, 6.5, 0xc49687);
        table(x, 5.2);
      }
      sign("SUNSET TABLE", 7, 9, 5);
    }
    if (level(s, "roofGarden")) {
      for (const z of [-7, -2, 4, 10]) {
        v.plant(10.1, z, 0.6, p);
        v.plant(-10.1, z, 0.6, p);
      }
      for (const x of [-9, -3, 3, 9]) {
        v.cyl(0.035, 0.035, 2.8, 0xb28d56, x, 1.7, -11.7, p);
        v.sphere(0.16, 0xffdd99, x, 3.1, -11.7, p);
      }
    }
  }
  for (const project of PROJECTS.filter(
    (a) => a.floor === s.floor && a.service && level(s, a.key),
  )) {
    const ring = new T.Mesh(
      new T.RingGeometry(0.95, 1.06, 32),
      new T.MeshBasicMaterial({
        color: 0x71d7b1,
        transparent: true,
        opacity: 0.65,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(project.service.x, 0.34, project.service.z);
    p.add(ring);
    v.resortRings.push({ project, ring });
  }
}
export function renderResort(v, dt) {
  const actors = v.game.resortActors || [];
  for (const { project, ring } of v.resortRings || []) {
    const order = actors.find(
      (a) => !a.worker && a.project === project.key && a.phase === "resortWait",
    );
    if (project.key === "roomService") {
      const at = order ? order.target : project.service;
      ring.position.set(at.x, 0.34, at.z);
    }
    ring.material.opacity = order ? 0.85 : 0.28;
    ring.scale.setScalar(
      order && !v.reducedMotion ? 1 + Math.sin(v.game.time * 3) * 0.04 : 1,
    );
  }
  for (const [i, car] of (v.resortCars || []).entries()) {
    const visiting = actors.find((a) => a.project === "garage" && !a.worker);
    car.visible = i < level(v.game.state, "garage") || (i === 2 && !!visiting);
    if (i === 2) {
      const target = visiting?.phase === "resortLeave" ? 22 : 16;
      if (!visiting) car.position.z = 22;
      else car.position.z += (target - car.position.z) * Math.min(1, dt * 0.9);
    }
  }
}
