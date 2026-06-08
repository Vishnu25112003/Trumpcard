/* ============================================================
   raceScene.js — Three.js desert racer scene
   Ported near-verbatim from the "Type to Drive" design handoff
   (race3d.js) into an ES-module class driven by React.
   Forward driving = +Z. Camera sits behind at -Z, so we see car REARS.
   World scrolls toward the camera (-Z) = forward motion; the player car
   stays centered and rivals are placed by progress relative to the player.
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODELS = '/models/cars/';

// ---- environment palettes -------------------------------------------
const ENVS = {
  desert: {
    day:  { skyTop:'#3f8fd6', skyMid:'#8ec6ef', skyHaze:'#eaf0f1', sun:'#fff4d6', sunY:.74,
            fog:'#e3ead0', fogN:75, fogF:380, ground:'#d9b878', shoulder:'#c8a45f',
            hemiSky:0xbfd9f0, hemiGnd:0xb89860, sunInt:1.15, ambInt:.85, kind:'desert' },
    dusk: { skyTop:'#26324f', skyMid:'#b5623e', skyHaze:'#f0a85e', sun:'#ffd58a', sunY:.62,
            fog:'#caa06a', fogN:60, fogF:320, ground:'#8d6a3f', shoulder:'#7c5c34',
            hemiSky:0xc98a55, hemiGnd:0x6e5230, sunInt:.95, ambInt:.6, kind:'desert' },
    night:{ skyTop:'#05080f', skyMid:'#0b1426', skyHaze:'#243049', sun:'#2b3a5c', sunY:.5,
            fog:'#0c1422', fogN:45, fogF:240, ground:'#2a2418', shoulder:'#241f15',
            hemiSky:0x223052, hemiGnd:0x161208, sunInt:.35, ambInt:.45, kind:'desert', dark:true }
  },
  green: {
    day:  { skyTop:'#3f8fd6', skyMid:'#9fcef0', skyHaze:'#e8f1ee', sun:'#fff6e0', sunY:.78,
            fog:'#dceee0', fogN:80, fogF:380, ground:'#3f8a3a', shoulder:'#5a7a3c',
            hemiSky:0xcfe6f5, hemiGnd:0x4c7a3a, sunInt:1.1, ambInt:.85, kind:'green' },
    dusk: { skyTop:'#2a3550', skyMid:'#9c6a52', skyHaze:'#e8a76a', sun:'#ffd58a', sunY:.62,
            fog:'#b88a5e', fogN:60, fogF:300, ground:'#2c5a2c', shoulder:'#3c5230',
            hemiSky:0xc98a55, hemiGnd:0x33502c, sunInt:.9, ambInt:.6, kind:'green' },
    night:{ skyTop:'#05080f', skyMid:'#0a1322', skyHaze:'#1d2740', sun:'#2b3a5c', sunY:.5,
            fog:'#0a1320', fogN:45, fogF:230, ground:'#12260f', shoulder:'#162a12',
            hemiSky:0x1f2c4a, hemiGnd:0x0c1808, sunInt:.35, ambInt:.45, kind:'green', dark:true }
  },
  city: {
    day:  { skyTop:'#5a93c8', skyMid:'#a6c4dc', skyHaze:'#dde6ea', sun:'#fff4dc', sunY:.74,
            fog:'#d4dde2', fogN:75, fogF:360, ground:'#6b6f72', shoulder:'#5c6063',
            hemiSky:0xc4d6e6, hemiGnd:0x6a6e72, sunInt:1.05, ambInt:.85, kind:'city' },
    dusk: { skyTop:'#222b46', skyMid:'#7c5c70', skyHaze:'#d98f6a', sun:'#ffcf8a', sunY:.6,
            fog:'#9c7c78', fogN:55, fogF:300, ground:'#4a4d52', shoulder:'#414449',
            hemiSky:0xb07a78, hemiGnd:0x3c3f44, sunInt:.9, ambInt:.6, kind:'city' },
    night:{ skyTop:'#04060d', skyMid:'#0a1322', skyHaze:'#1a2236', sun:'#27344f', sunY:.5,
            fog:'#080f1a', fogN:45, fogF:230, ground:'#1c1f24', shoulder:'#181b20',
            hemiSky:0x1c2740, hemiGnd:0x101216, sunInt:.4, ambInt:.5, kind:'city', dark:true }
  }
};

// ---- texture helpers -------------------------------------------------
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return `rgba(${r},${g},${b},${a})`; }

function makeSky(p) {
  const c = cnv(64, 512), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, p.skyTop); g.addColorStop(.5, p.skyMid); g.addColorStop(1, p.skyHaze);
  x.fillStyle = g; x.fillRect(0, 0, 64, 512);
  const sy = 512 * (1 - p.sunY);
  const rg = x.createRadialGradient(32, sy, 2, 32, sy, 160);
  rg.addColorStop(0, p.sun); rg.addColorStop(.3, hexA(p.sun, .45)); rg.addColorStop(1, hexA(p.sun, 0));
  x.fillStyle = rg; x.fillRect(0, 0, 64, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace || undefined; return t;
}

function makeRoad(dark) {
  const W = 512, H = 2048, c = cnv(W, H), x = c.getContext('2d');
  x.fillStyle = dark ? '#15171a' : '#23262b'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 26000; i++) {
    const v = Math.random(); const g = (dark ? 20 : 40) + v * (dark ? 14 : 26);
    x.fillStyle = `rgba(${g},${g},${g + 2},${.04 + v * .06})`;
    x.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 2;
  for (let i = 0; i < 7; i++) { x.beginPath(); const xx = 60 + Math.random() * (W - 120); x.moveTo(xx, 0); x.lineTo(xx + (Math.random() * 30 - 15), H); x.stroke(); }
  x.fillStyle = dark ? 'rgba(220,220,220,.65)' : 'rgba(245,245,245,.92)';
  x.fillRect(36, 0, 12, H); x.fillRect(W - 48, 0, 12, H);
  x.fillStyle = dark ? '#b89224' : '#f2c33a';
  const dash = 150, gap = 130;
  for (let yy = 0; yy < H; yy += dash + gap) { x.fillRect(W / 2 - 26, yy, 14, dash); x.fillRect(W / 2 + 12, yy, 14, dash); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 18); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace || undefined;
  return t;
}

function makeShadowTex() {
  const c = cnv(128, 128), x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function makeCloudTex() {
  const c = cnv(128, 64), x = c.getContext('2d');
  x.clearRect(0, 0, 128, 64);
  for (let i = 0; i < 22; i++) { const cx = 20 + Math.random() * 88, cy = 24 + Math.random() * 22, r = 10 + Math.random() * 16; const g = x.createRadialGradient(cx, cy, 1, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }
  return new THREE.CanvasTexture(c);
}
function makeCheckerTex() {
  const n = 8, cell = 24, W = n * cell, H = 2 * cell, c = cnv(W, H), x = c.getContext('2d');
  for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
    x.fillStyle = ((i + r) % 2 === 0) ? '#0d0d0d' : '#f4f1ea';
    x.fillRect(i * cell, r * cell, cell, cell);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace || undefined; return t;
}

// ---- scenery factories ----------------------------------------------
function matLambert(color) { return new THREE.MeshLambertMaterial({ color }); }
function makeCactus() {
  const g = new THREE.Group();
  const m = matLambert(0x4f7a3c);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.45, .55, 4.4, 7), m);
  trunk.position.y = 2.2; g.add(trunk);
  const arm = (s) => { const a = new THREE.Group();
    const v = new THREE.Mesh(new THREE.CylinderGeometry(.26, .3, 1.6, 6), m); v.position.y = .8; a.add(v);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(.26, .3, 1.0, 6), m); h.rotation.z = Math.PI / 2; h.position.set(s * .5, 0, 0); a.add(h);
    a.position.set(s * .55, 2.2, 0); return a; };
  g.add(arm(1)); const a2 = arm(-1); a2.position.y = 2.9; g.add(a2);
  g.scale.setScalar(.8 + Math.random() * .7);
  return g;
}
function makeRock() {
  const g = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), matLambert(0xa08a66));
  g.scale.set(1 + Math.random(), .6 + Math.random() * .7, 1 + Math.random()); g.rotation.y = Math.random() * 6;
  g.position.y = g.scale.y * .5 * 1; return g;
}
function makeMesa() {
  const h = 14 + Math.random() * 22, r = 8 + Math.random() * 10;
  const g = new THREE.Mesh(new THREE.CylinderGeometry(r * .7, r, h, 6), matLambert(0xa9784a));
  g.position.y = h / 2; g.rotation.y = Math.random() * 6; return g;
}
function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, 2.4, 6), matLambert(0x6b4a2a));
  trunk.position.y = 1.2; g.add(trunk);
  const c = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 8), matLambert(0x336b2c));
  c.position.y = 4.5; g.add(c);
  g.scale.setScalar(.8 + Math.random() * .8); return g;
}
function makeBush() {
  const g = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), matLambert(0x3f7a36));
  g.scale.set(1 + Math.random(), .7 + Math.random() * .5, 1 + Math.random()); g.position.y = g.scale.y * .5; return g;
}
function makeBuilding() {
  const w = 6 + Math.random() * 8, h = 18 + Math.random() * 48, d = 6 + Math.random() * 8;
  const cols = [0x4a4f57, 0x565b63, 0x3e434b, 0x60656d];
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matLambert(cols[(Math.random() * cols.length) | 0]));
  g.position.y = h / 2; return g;
}

export class RaceScene {
  constructor() {
    this.inited = false; this.running = false;
    this.cars = {}; this.carList = [];
    this.scroll = 0; this.worldSpeed = 0; this.targetSpeed = 0;
    this.env = 'desert'; this.time = 'day'; this.palette = null;
    this._t = 0;
    this._onResize = () => this.resize();
  }

  init(canvas) {
    if (this.inited) return;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace || undefined;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(54, 16 / 9, .1, 600);
    this.camera.position.set(0, 3.1, -10.5);
    this.camera.lookAt(0, 0.7, 22);

    this.hemi = new THREE.HemisphereLight(0xbfd9f0, 0xb89860, 1);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.1);
    this.sun.position.set(-30, 50, -10);
    this.scene.add(this.sun);
    this.amb = new THREE.AmbientLight(0xffffff, .4); this.scene.add(this.amb);

    this.skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 16), this.skyMat);
    this.scene.add(this.sky);

    this.groundMat = matLambert(0xd9b878);
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), this.groundMat);
    this.ground.rotation.x = -Math.PI / 2; this.ground.position.y = -0.02;
    this.scene.add(this.ground);

    this.shoulderMat = matLambert(0xc8a45f);
    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(30, 600), this.shoulderMat);
    shoulder.rotation.x = -Math.PI / 2; shoulder.position.set(0, 0, 250);
    this.scene.add(shoulder); this.shoulder = shoulder;

    this.roadTexDay = makeRoad(false); this.roadTexDark = makeRoad(true);
    this.roadMat = new THREE.MeshBasicMaterial({ map: this.roadTexDay, fog: true });
    this.road = new THREE.Mesh(new THREE.PlaneGeometry(16, 600), this.roadMat);
    this.road.rotation.x = -Math.PI / 2; this.road.position.set(0, 0.01, 250);
    this.scene.add(this.road);

    this.cloudTex = makeCloudTex();
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.cloudTex, opacity: .85, depthWrite: false, fog: false }));
      s.scale.set(70 + Math.random() * 60, 30 + Math.random() * 20, 1);
      s.position.set((Math.random() - .5) * 500, 80 + Math.random() * 90, 120 + Math.random() * 300);
      this.scene.add(s); this.clouds.push(s);
    }

    this.shadowTex = makeShadowTex();
    this.near = []; this.far = [];
    this._buildScenery();
    this._buildRail();
    this._buildFinish();

    this.loader = new GLTFLoader();
    this.inited = true;
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  _clearGroup(arr) { arr.forEach((o) => this.scene.remove(o.obj || o)); arr.length = 0; }

  _buildScenery() {
    this._clearGroup(this.near); this._clearGroup(this.far);
    const kind = this.palette ? this.palette.kind : 'desert';
    const nearFactory = kind === 'green' ? [makeTree, makeBush, makeRock]
      : kind === 'city' ? [makeBuilding, makeRock, makeBuilding]
        : [makeCactus, makeRock, makeCactus];
    for (let i = 0; i < 46; i++) {
      const f = nearFactory[(Math.random() * nearFactory.length) | 0];
      const obj = f();
      const side = Math.random() < .5 ? -1 : 1;
      const off = 13 + Math.random() * 46;
      obj.position.x = side * off;
      obj.position.z = Math.random() * 360;
      this.scene.add(obj);
      this.near.push({ obj, side, off });
    }
    const farFactory = kind === 'city' ? [makeBuilding] : [makeMesa];
    if (kind !== 'green') {
      for (let i = 0; i < 10; i++) {
        const obj = farFactory[0]();
        if (kind === 'city') obj.scale.setScalar(1.8 + Math.random());
        const side = Math.random() < .5 ? -1 : 1;
        obj.position.x = side * (80 + Math.random() * 120);
        obj.position.z = Math.random() * 380;
        this.scene.add(obj);
        this.far.push({ obj, side });
      }
    }
  }

  _buildRail() {
    if (this.rail) this.scene.remove(this.rail);
    const g = new THREE.Group();
    const postMat = matLambert(0x9aa0a6), barMat = matLambert(0xc4c9cf);
    for (let side of [-1, 1]) {
      const x = side * 8.6;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.12, .3, 600), barMat);
      bar.position.set(x, .85, 250); g.add(bar);
      const bar2 = bar.clone(); bar2.position.y = .45; g.add(bar2);
      for (let z = 0; z < 600; z += 8) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.0, .16), postMat);
        p.position.set(x, .5, z); g.add(p);
      }
    }
    this.rail = g; this.scene.add(g);
  }

  _buildFinish() {
    if (this.finish) this.scene.remove(this.finish);
    const g = new THREE.Group();
    const postMat = matLambert(0xd23b3b);
    for (const sx of [-8.4, 8.4]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.3, .35, 6.4, 8), postMat);
      p.position.set(sx, 3.2, 0); g.add(p);
    }
    const tex = makeCheckerTex();
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(8, 1);
    const banner = new THREE.Mesh(new THREE.BoxGeometry(17.6, 1.7, .25),
      new THREE.MeshBasicMaterial({ map: tex, fog: true }));
    banner.position.set(0, 5.4, 0); g.add(banner);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(17.6, .45, .2),
      new THREE.MeshBasicMaterial({ color: 0xf59e1b, fog: true }));
    strip.position.set(0, 4.35, 0); g.add(strip);
    const tex2 = makeCheckerTex(); tex2.wrapS = THREE.RepeatWrapping; tex2.repeat.set(8, 1);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 3),
      new THREE.MeshBasicMaterial({ map: tex2, fog: true }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0.03, 0); g.add(ground);
    g.position.z = 263; g.visible = false;
    this.finish = g; this.scene.add(g);
  }

  applyEnv(env, time) {
    this.env = env || this.env; this.time = time || this.time;
    const p = (ENVS[this.env] || ENVS.desert)[this.time] || ENVS.desert.day;
    this.palette = p;
    this.skyMat.map = makeSky(p); this.skyMat.needsUpdate = true;
    this.scene.fog = new THREE.Fog(new THREE.Color(p.fog), p.fogN, p.fogF);
    this.renderer.setClearColor(new THREE.Color(p.skyHaze));
    this.groundMat.color.set(p.ground); this.shoulderMat.color.set(p.shoulder);
    this.hemi.color.set(p.hemiSky); this.hemi.groundColor.set(p.hemiGnd); this.hemi.intensity = 1;
    this.sun.intensity = p.sunInt; this.amb.intensity = p.ambInt;
    this.sun.color.set(p.dark ? 0x9fb0d8 : 0xffffff);
    this.sun.position.set(-40, 30 + p.sunY * 60, -20);
    this.roadMat.map = p.dark ? this.roadTexDark : this.roadTexDay; this.roadMat.needsUpdate = true;
    this.clouds.forEach((c) => { c.material.opacity = p.dark ? 0 : (this.env === 'city' ? .5 : .85); });
    this.carList.forEach((c) => { if (c.head) c.head.forEach((h) => { h.visible = !!p.dark; }); });
    this._buildScenery(); this._buildRail();
  }

  // load + place all cars
  setup(opts) {
    this.applyEnv(opts.env || 'desert', opts.time || 'day');
    this.carList.forEach((c) => this.scene.remove(c.group)); this.cars = {}; this.carList = [];
    this.scroll = 0; this.worldSpeed = 0; this.targetSpeed = 0;
    if (this.finish) this.finish.position.z = 263;
    const list = opts.cars;
    let loaded = 0;
    return new Promise((resolve) => {
      if (!list.length) { resolve(); return; }
      list.forEach((spec) => {
        this.loader.load(MODELS + spec.model + '.glb', (gltf) => {
          const group = new THREE.Group();
          const m = gltf.scene;
          const box = new THREE.Box3().setFromObject(m);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const len = Math.max(size.x, size.z);
          const scale = 4.4 / len;
          m.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
          m.scale.setScalar(scale);
          if (spec.tint) {
            m.traverse((o) => {
              if (o.isMesh && o.material && o.material.color) {
                const lum = (o.material.color.r + o.material.color.g + o.material.color.b) / 3;
                if (lum > 0.12 && lum < 0.95) { o.material = o.material.clone(); o.material.color.set(spec.tint); }
              }
            });
          }
          group.add(m);
          const sh = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 5.0),
            new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, fog: true }));
          sh.rotation.x = -Math.PI / 2; sh.position.y = .02; group.add(sh);
          const head = [];
          [-.7, .7].forEach((hx) => {
            const hl = new THREE.Mesh(new THREE.ConeGeometry(1.1, 7, 12, 1, true),
              new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false, fog: true }));
            hl.rotation.x = -Math.PI / 2; hl.position.set(hx, .6, 3.6); hl.visible = false; group.add(hl); head.push(hl);
          });
          group.position.set(spec.lane, 0, 8);
          this.scene.add(group);
          const car = { id: spec.id, group, head, isPlayer: !!spec.isPlayer,
            lane: spec.lane, targetLane: spec.lane, progress: 0, z: 8, targetZ: 8,
            phase: Math.random() * 6, color: spec.color };
          if (this.palette && this.palette.dark) head.forEach((h) => { h.visible = true; });
          this.cars[spec.id] = car; this.carList.push(car);
          loaded++; if (loaded === list.length) { this.carList.sort((a, b) => a.lane - b.lane); resolve(); }
        }, undefined, () => { loaded++; if (loaded === list.length) resolve(); });
      });
    });
  }

  setProgress(id, prog) { const c = this.cars[id]; if (c) c.progress = Math.max(0, Math.min(1, prog)); }
  setPlayerSpeed(norm) { this.targetSpeed = Math.max(0, Math.min(1, norm)); }

  _carTargetZ(car, playerProg) {
    const rel = car.progress - playerProg;
    let z = 8 + rel * 255;
    return Math.max(-2, Math.min(330, z));
  }

  start() { if (this.running) return; this.running = true; this._t = performance.now(); this._loop(); }
  stop() { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    try { this.renderer?.dispose(); } catch { /* ignore */ }
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now(); let dt = (now - this._t) / 1000; this._t = now;
    dt = Math.min(dt, .05);
    this._update(dt);
    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _update(dt) {
    this.worldSpeed += (this.targetSpeed - this.worldSpeed) * Math.min(1, dt * 3.2);
    // NO idle creep: the world only moves while the player is actually typing.
    const idle = 0;
    const spd = (idle + this.worldSpeed) * 56;
    this.scroll += spd * dt;

    if (this.roadMat.map) { this.roadMat.map.offset.y = -this.scroll * 0.0145; }

    for (const s of this.near) {
      s.obj.position.z -= spd * dt;
      if (s.obj.position.z < -16) {
        s.obj.position.z += 376;
        s.side = Math.random() < .5 ? -1 : 1;
        s.off = 13 + Math.random() * 46;
        s.obj.position.x = s.side * s.off;
      }
    }
    for (const s of this.far) {
      s.obj.position.z -= spd * dt * 0.45;
      if (s.obj.position.z < -40) { s.obj.position.z += 420; s.side = Math.random() < .5 ? -1 : 1; s.obj.position.x = s.side * (80 + Math.random() * 120); }
    }
    for (const c of this.clouds) { c.position.x += dt * 2; if (c.position.x > 280) c.position.x = -280; }

    const player = this.carList.find((c) => c.isPlayer);
    const pProg = player ? player.progress : 0;

    const bob = this.worldSpeed;
    for (const c of this.carList) {
      c.targetZ = c.isPlayer ? 8 : this._carTargetZ(c, pProg);
      c.z += (c.targetZ - c.z) * Math.min(1, dt * 4.5);
      c.group.position.z = c.z;
      c.phase += dt * (6 + bob * 10);
      c.group.position.y = Math.sin(c.phase) * 0.025 * (0.4 + bob);
      c.group.rotation.z = Math.sin(c.phase * 0.7) * 0.012 * (0.3 + bob);
      c.group.rotation.y = Math.sin(c.phase * 0.5) * 0.01;
      c.group.visible = c.group.position.z > -3.5;
    }

    // finish line approaches as the player progresses; crossed at 100%
    if (this.finish) {
      const fz = 8 + (1 - pProg) * 255;
      this.finish.position.z += (fz - this.finish.position.z) * Math.min(1, dt * 4.5);
      this.finish.visible = true;
    }
  }

  // project a car's label anchor to screen px (relative to the canvas)
  getTag(id) {
    const c = this.cars[id]; if (!c || !c.group.visible) return { visible: false };
    const v = new THREE.Vector3(c.group.position.x, c.group.position.y + 2.4, c.group.position.z);
    v.project(this.camera);
    if (v.z > 1) return { visible: false };
    if (Math.abs(v.x) > 1.08 || v.y < -0.92) return { visible: false };
    const r = this.canvas.getBoundingClientRect();
    return { visible: true,
      x: (v.x * 0.5 + 0.5) * r.width,
      y: (-v.y * 0.5 + 0.5) * r.height,
      depth: c.group.position.z };
  }

  resize() {
    if (!this.inited) return;
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
}
