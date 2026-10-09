import { coverFloor, placeArchitecture } from "./architecture.js?v=07f894a9cb744be8";
import * as T from "./vendor/three.module.js?v=07f894a9cb744be8";
import { HotelView } from "./view.js?v=07f894a9cb744be8";
import { PADS } from "./model.js?v=07f894a9cb744be8";
export class RooftopView extends HotelView {
  makeWorld() {
    this.addSea();
    this.scene.background = new T.Color(0xabcfc9);
    this.box(23, 1.4, 29, 0xd4bf9e, 0, -0.5, 1.5);
    this.round(22.5, 0.12, 28.5, 0xf3e3c5, 0, 0.23, 1.5, this.scene, 0.5);
    if (
      !coverFloor(this, "rooftop-pavers", this.scene, 0, 1.5, 22.5, 28.5, 0.295)
    ) {
      for (let z = -12; z < 15; z += 1.2)
        this.box(22, 0.012, 0.025, 0xe1cdaa, 0, 0.31, z);
    }
    coverFloor(this, "rooftop-teak-deck", this.scene, 6, -3, 8, 17, 0.3);
    for (const x of [-11, 11]) {
      for (let z = -10.5; z < 15; z += 4) {
        const length = Math.min(4, 15.5 - (z - 2));
        if (
          !placeArchitecture(
            this,
            "rooftop-railing",
            this.scene,
            x,
            0.25,
            z - 2 + length / 2,
            length,
            Math.PI / 2,
            0.7,
          )
        )
          this.box(0.25, 0.8, length, 0xeaddc1, x, 0.65, z - 2 + length / 2);
      }
    }
    for (let x = -9; x < 11; x += 4) {
      const length = Math.min(4, 11 - (x - 2));
      if (
        !placeArchitecture(
          this,
          "rooftop-railing",
          this.scene,
          x - 2 + length / 2,
          0.25,
          -12.5,
          length,
          0,
          0.7,
        )
      )
        this.box(length, 0.8, 0.25, 0xeaddc1, x - 2 + length / 2, 0.65, -12.5);
    }
    this.round(9.5, 0.3, 11, 0xfff6e2, -4.2, 0.4, -4.5, this.scene, 0.8);
    this.round(8.5, 0.07, 10, 0x55b9c0, -4.2, 0.59, -4.5, this.scene, 0.6);
    this.poolRipples = [];
    for (let n = 0; n < 5; n++) {
      const material = new T.MeshBasicMaterial({
        color: 0xdcfff3,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      });
      const ripple = new T.Mesh(new T.RingGeometry(0.36, 0.38, 32), material);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.set(
        -6.8 + (n % 3) * 2.2,
        0.636,
        -7.2 + Math.floor(n / 3) * 4.1,
      );
      this.scene.add(ripple);
      this.poolRipples.push(ripple);
    }
    // A compact ladder and submerged steps give the pool a finished edge.
    for (const x of [-1.35, -0.85]) {
      this.cyl(0.035, 0.035, 0.7, 0xd6e5da, x, 0.82, -1.1);
      this.cyl(0.035, 0.035, 0.48, 0xd6e5da, x, 0.73, -0.7);
      this.round(0.065, 0.065, 0.5, 0xd6e5da, x, 1.14, -0.9, this.scene, 0.025);
    }
    for (const y of [0.64, 0.85])
      this.round(0.6, 0.065, 0.11, 0xd6e5da, -1.1, y, -1.1, this.scene, 0.025);
    const ring = this.mesh(
      new T.TorusGeometry(0.5, 0.13, 8, 28),
      0xf2b781,
      -5,
      0.76,
      -4,
    );
    ring.rotation.x = Math.PI / 2;
    this.roofFloat = ring;
    for (const x of [-9.7, 9.7]) {
      this.plant(x, 13, 0.9);
      this.plant(x, -11.4, 0.9);
    }
    // A distant skyline makes the change of floor feel like a destination.
    for (let i = 0; i < 12; i++)
      this.box(
        2.7,
        2 + (i % 4) * 1.7,
        3,
        0x9bb8b5,
        -27 + i * 5,
        -4,
        -28 - (i % 2) * 3,
      );
    this.round(3.3, 0.18, 3.2, 0x839c87, 3.2, 0.34, 12.8, this.scene, 0.3);
    this.box(3.3, 2.8, 0.3, 0x658c80, 3.2, 1.6, 11.3);
    this.box(2.3, 2.3, 0.08, 0xc0d1bc, 3.2, 1.45, 11.48);
    this.box(0.035, 2.3, 0.09, 0x769989, 3.2, 1.45, 11.55);
    this.sign(
      "LIFT",
      1.6,
      0.38,
      3.2,
      3.2,
      11.5,
      this.scene,
      "#315c50",
      "#fff5d5",
      36,
    );
    this.sign(
      "THE SKY CLUB",
      6,
      0.75,
      -3,
      0.38,
      9,
      this.scene,
      "#f3e3c5",
      "#456b5e",
      42,
    ).rotation.x = -Math.PI / 2;
    this.serviceRing = this.mesh(
      new T.RingGeometry(0.7, 0.8, 24),
      0x7cddb0,
      0,
      0,
      0,
    );
    this.cashRing = this.mesh(
      new T.RingGeometry(0.7, 0.8, 24),
      0x7cddb0,
      0,
      0,
      0,
    );
    for (const pad of PADS.filter((p) => p.i >= 29 && p.i <= 32))
      this.makePurchasePad(pad, 0.4);
  }

  rebuild() {
    if (this.facilities) this.disposeGroup(this.facilities);
    const p = (this.facilities = new T.Group());
    this.scene.add(p);
    const s = this.game.state;
    for (let n = 0; n < 2 + s.poolLevel * 2; n++) {
      const x = -8 + (n % 3) * 2.7,
        z = 3 + Math.floor(n / 3) * 2.6;
      if (!this.addFurniture("pool-lounger", p, x, 0.3, z, 1, 0xdba38d)) {
        this.round(1.6, 0.25, 2, 0xfff3d9, x, 0.52, z, p, 0.15);
        this.round(1.35, 0.12, 1.7, 0xdba38d, x, 0.7, z, p, 0.12);
      }
      if (s.poolLevel) {
        if (!this.addFurniture("pool-umbrella", p, x, 0.3, z, 1, 0xdba38d)) {
          this.cyl(0.035, 0.035, 2.6, 0xb59669, x, 1.7, z, p);
          this.mesh(new T.ConeGeometry(1.15, 0.45, 8), 0xf1d8ad, x, 3, z, p);
        }
      }
    }
    const juiceBar =
      s.roofJuice &&
      this.addFurniture("bar-counter", p, 7, 0.3, -10, 1, 0xe6ae7d);
    if (juiceBar) juiceBar.scale.x = 0.78;
    if (!juiceBar) {
      this.round(
        4,
        0.8,
        1.5,
        s.roofJuice ? 0xc59665 : 0xd8cdb5,
        7,
        0.78,
        -10,
        p,
        0.2,
      );
    }
    this.sign(
      s.roofJuice ? "SUNSET JUICE" : "JUICE BAR · COMING SOON",
      4,
      0.55,
      7,
      1.8,
      -10.4,
      p,
      "#315c50",
      "#fff4d4",
      30,
    );
    if (s.roofJuice && !juiceBar)
      for (let i = 0; i < 5; i++)
        this.cyl(0.11, 0.09, 0.3, 0xedb458, 5.7 + i * 0.5, 1.37, -9.7, p);
    this.round(
      4,
      0.08,
      3.6,
      s.roofSpa ? 0xc5d4bd : 0xe0d8c3,
      7,
      0.35,
      -1.3,
      p,
      0.3,
    );
    if (s.roofSpa)
      for (const x of [6, 8]) {
        if (!this.addFurniture("spa-bed", p, x, 0.3, -1.4)) {
          this.round(1.5, 0.7, 2.5, 0xfbf0d9, x, 0.75, -1.4, p, 0.16);
          this.round(1.1, 0.1, 0.45, 0xa1bba6, x, 1.15, -2.2, p, 0.12);
        }
      }
    this.sign(
      s.roofSpa ? "PALM SPA" : "SPA · COMING SOON",
      3,
      0.5,
      7,
      1.8,
      -3.1,
      p,
      "#315c50",
      "#fff4d4",
      30,
    );
    this.roofHosts = [];
    for (let i = 0; i < s.attendants; i++) {
      const host = this.character(4);
      host.position.set(-3 + i * 1.2, 0, 11.5);
      host.userData.luggage.visible = false;
      p.add(host);
      this.roofHosts.push(host);
    }
  }
  render(dt) {
    for (const [i, actor] of (this.roofHosts || []).entries()) {
      const host = this.game.hosts[i];
      actor.position.set(host.x, 0, host.z);
      actor.rotation.y = host.angle;
      this.animateActor(actor, host, dt);
    }
    for (const [i, ripple] of (this.poolRipples || []).entries()) {
      const phase = this.reducedMotion
        ? 0.4
        : (this.game.time * 0.22 + i * 0.19) % 1;
      ripple.scale.setScalar(0.7 + phase * 2.5);
      ripple.material.opacity = Math.sin(phase * Math.PI) * 0.16;
    }
    super.render(dt);
    if (this.roofFloat)
      this.roofFloat.position.y = 0.76 + Math.sin(this.game.time * 1.5) * 0.06;
  }
}
