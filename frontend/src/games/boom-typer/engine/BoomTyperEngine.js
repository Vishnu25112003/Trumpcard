/* ============================================================
   BOOM TYPER — ZTYPE-style canvas typing shooter (engine)
   Ported from the "Boom Typer" design handoff (game.js) into a
   self-contained engine class. The React component owns the DOM
   overlays/HUD and drives the engine via its action methods; the
   engine owns the canvas simulation, rendering, input, and the
   game state machine, pushing snapshots back through `onState`.
   ============================================================ */

// ---------- Word bank ----------
const WORDS = {
  short: "able acid aged also area army away baby back ball band bank base bath bear beat been beer bell belt best bird blow blue boat body bold bomb bone book boom boot born boss both bowl bulk burn bush busy cage cake call calm camp card care case cash cast cell chip city clip club coal coat code cold cook cool cope copy core corn cost crew crop dark data date dawn days dead deal dean dear debt deck deep deer desk dial diet dirt dish disk does dome done door dose down draw drew drop drug drum dual duke dust duty each earn east easy edge fact fade fail fair fall farm fast fate fear feed feel feet fell file fill film find fine fire firm fish five flag flat flow folk font food fool foot ford form fort four free frog from fuel full fund gain game gate gear gift girl give glad glow goal goat gold golf gone good gray grew grid grip grow gulf hall hand hang hard harm hate have hawk head heal heap hear heat held hell help herb herd here hero hide high hill hint hire hold hole holy home hope horn host hour huge hung hunt hurt".split(" "),
  mid: "above actor adapt adopt agent alarm album alert alien align alike alive allow alone along amber angle angry apart apple apply arena argue arise armor array arrow aside asset audio avoid award aware badge baker basic batch beach beard beast began begin being below bench berry birth black blade blame blank blast blaze bleed blend bless blind block blood bloom blown blues board boast bonus boost booth bound brace brain brake brand brass brave bread break breed brick bride brief bring broad broke brown brush build built bunch burst cabin cable cargo carve catch cause chain chair chalk charm chart chase cheap check chess chest chief child china claim clash class clean clear clerk click cliff climb clock close cloud coach coast color comet coral count court cover crack craft crash crazy cream creek crest crime crisp cross crowd crown crush curve cycle".split(" "),
  long: "absorb accept access across action active actual advice affect afford agency agenda almost always amount animal annual answer anyone appeal arctic around arrive aspect assist assume athena attack attend august author bandit banner barrel basket battle beacon beauty became become before behind belief belong beyond bishop blazon border bottle bottom bought bounce branch breath bridge bright broken bronze budget bullet bundle button camera campus cancel candle canyon carbon castle casual caught center chance change charge cheese chosen church circle clever client closer cobalt combat comedy coming common copper corner cosmos cotton county couple course cousin cradle create credit crisis critic custom damage danger dealer debris decade decide defeat defend define degree delete demand depart depend deploy desert design desire detail detect device devote differ dinner direct divide doctor domain double driven driver during eagle".split(" "),
  epic: "absolute abstract academy accident accuracy accurate activate addition adequate advanced advisor aircraft alphabet analysis announce anything appendix approach approval aquarium argument artistic assemble athletic attitude audience aviation backbone bacteria baseball benchmark birthday blizzard blueprint boundary brewery brigade brilliant building campaign capacity carnival category ceremony champion chemical children cinnamon civilian clearance collapse colonial colorful combined commerce communal complete composer compound computer conclude concrete conflict congress conquest consider constant consumer contrast creative customer database daughter daylight dazzling decisive delegate delivery describe detector dialogue dinosaur director disaster discount discover disposal distance dividend doctrine document dominant dramatic duration dynamics earnings eclipse economic educate election elegant elevate eligible emerald emotion empire enchant".split(" "),
};

const STATE = { TITLE: "title", PLAYING: "playing", PAUSED: "paused", WAVECLEAR: "waveclear", GAMEOVER: "gameover", HOWTO: "howto", SCORES: "scores" };
const LS_KEY = "boomTyperBest";

// ---------- Helpers ----------
function pad(n, len) { return String(Math.max(0, Math.floor(n))).padStart(len, "0"); }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function loadBest() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { score: 0, wave: 0 }; }
  catch { return { score: 0, wave: 0 }; }
}
function saveBest(b) { try { localStorage.setItem(LS_KEY, JSON.stringify(b)); } catch { /* ignore */ } }

export class BoomTyperEngine {
  constructor(field, canvas, callbacks = {}) {
    this.field = field;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.callbacks = callbacks;

    this.TWEAKS = { accent: "#ff9d2e", speedMul: 1.0, gridGlow: true };

    this.state = STATE.TITLE;
    this.W = 0; this.H = 0; this.DPR = 1;
    this.dangerY = 0; this.shipX = 0; this.shipY = 0;

    this.game = {
      wave: 1, score: 0, multiplier: 1,
      bombs: [], projectiles: [], particles: [], floaters: [],
      lockedId: null, typedPrefix: '',
      spawnQueue: 0, spawnTimer: 0, spawnInterval: 1.4,
      waveTotal: 0, waveCleared: 0,
      keystrokes: 0, errors: 0, wordsCleared: 0,
      runStart: 0, shake: 0,
      shipPulse: 0, shipRecoil: 0,
      progressPct: 0,
    };

    this.bombSeq = 1;
    this.lastT = 0;
    this.stars = [];
    this.bgCanvas = null;
    this.rafId = null;
    this.running = false;
    this.waveClearTimer = null;

    this.best = loadBest();

    this._onResize = () => this.resize();
    this._onKey = (e) => this.handleKey(e);
    this._loop = (t) => this.loop(t);
  }

  // ---------- Lifecycle ----------
  start() {
    this.running = true;
    this.resize();
    window.addEventListener("resize", this._onResize);
    window.addEventListener("keydown", this._onKey);
    this.setState(STATE.TITLE);
    this.showScreen("title");
    this.rafId = requestAnimationFrame(this._loop);
  }

  destroy() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.waveClearTimer) clearTimeout(this.waveClearTimer);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("keydown", this._onKey);
  }

  // ---------- State / emit ----------
  emit() {
    const g = this.game;
    const hudVisible = this.state === STATE.PLAYING || this.state === STATE.PAUSED
      || this.state === STATE.WAVECLEAR || this.state === STATE.GAMEOVER;
    const mins = Math.max(0.05, (performance.now() - g.runStart) / 60000);
    this.callbacks.onState?.({
      screen: this._screen,
      hudVisible,
      score: pad(g.score, 6),
      mult: g.multiplier > 1 ? " x" + g.multiplier : "",
      progressPct: g.progressPct,
      waveClear: {
        title: "WAVE " + pad(g.wave, 3) + " CLEAR",
        score: pad(g.score, 6),
      },
      gameover: {
        score: pad(g.score, 6),
        wave: g.wave,
        acc: (g.keystrokes ? Math.round(((g.keystrokes - g.errors) / g.keystrokes) * 100) : 100) + "%",
        wpm: Math.round(g.wordsCleared / mins),
        words: g.wordsCleared,
      },
      best: {
        score: pad(this.best.score, 6),
        wave: this.best.wave ? "WAVE " + pad(this.best.wave, 3) : "—",
      },
    });
  }

  setState(s) { this.state = s; }

  showScreen(name) {
    this._screen = name || null;
    this.emit();
  }

  // ---------- Sizing ----------
  resize() {
    const availH = window.innerHeight - 36;
    const availW = window.innerWidth - 36;
    const ratio = 0.625; // w/h portrait
    let h = Math.min(availH, 920);
    let w = h * ratio;
    if (w > availW) { w = availW; h = w / ratio; }
    if (h > availH) { h = availH; w = h * ratio; }
    this.W = Math.round(w); this.H = Math.round(h);
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);

    this.field.style.width = this.W + "px";
    this.field.style.height = this.H + "px";
    this.canvas.width = Math.round(this.W * this.DPR);
    this.canvas.height = Math.round(this.H * this.DPR);
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);

    this.dangerY = this.H - 60;
    this.shipX = this.W / 2;
    this.shipY = this.H - 30;

    this.buildStars();
    this.buildBackground();
  }

  buildStars() {
    this.stars = [];
    const n = Math.round((this.W * this.H) / 5200);
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        r: Math.random() * 1.1 + 0.2,
        a: Math.random() * 0.5 + 0.12,
      });
    }
  }

  buildBackground() {
    const { W, H, DPR } = this;
    this.bgCanvas = document.createElement("canvas");
    this.bgCanvas.width = Math.round(W * DPR);
    this.bgCanvas.height = Math.round(H * DPR);
    const b = this.bgCanvas.getContext("2d");
    b.setTransform(DPR, 0, 0, DPR, 0, 0);

    // base gradient
    const g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a1614");
    g.addColorStop(0.55, "#081011");
    g.addColorStop(1, "#05090a");
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);

    // nebula blobs
    const blobs = [
      { x: W * 0.3, y: H * 0.25, r: W * 0.55, c: "rgba(30,90,84,0.16)" },
      { x: W * 0.75, y: H * 0.5, r: W * 0.5, c: "rgba(24,60,90,0.14)" },
      { x: W * 0.5, y: H * 0.78, r: W * 0.6, c: "rgba(40,70,70,0.1)" },
      { x: W * 0.15, y: H * 0.62, r: W * 0.4, c: "rgba(60,40,80,0.08)" },
    ];
    blobs.forEach((bl) => {
      const rg = b.createRadialGradient(bl.x, bl.y, 0, bl.x, bl.y, bl.r);
      rg.addColorStop(0, bl.c);
      rg.addColorStop(1, "transparent");
      b.fillStyle = rg;
      b.fillRect(0, 0, W, H);
    });

    // grid
    const cell = 26;
    b.lineWidth = 1;
    b.strokeStyle = this.TWEAKS.gridGlow ? "rgba(56,224,192,0.07)" : "rgba(120,140,140,0.05)";
    b.beginPath();
    for (let x = 0; x <= W; x += cell) { b.moveTo(x + 0.5, 0); b.lineTo(x + 0.5, H); }
    for (let y = 0; y <= H; y += cell) { b.moveTo(0, y + 0.5); b.lineTo(W, y + 0.5); }
    b.stroke();

    // stars
    this.stars.forEach((s) => {
      b.beginPath();
      b.fillStyle = "rgba(220,235,235," + s.a + ")";
      b.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      b.fill();
    });

    // vignette
    const vg = b.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(0,0,0,0.45)");
    b.fillStyle = vg;
    b.fillRect(0, 0, W, H);
  }

  // ---------- Word selection ----------
  wordPoolForWave(wave) {
    if (wave <= 1) return WORDS.short;
    if (wave === 2) return Math.random() < 0.7 ? WORDS.short : WORDS.mid;
    if (wave <= 4) return pick([WORDS.short, WORDS.mid, WORDS.mid]);
    if (wave <= 6) return pick([WORDS.mid, WORDS.mid, WORDS.long]);
    if (wave <= 8) return pick([WORDS.mid, WORDS.long, WORDS.long]);
    return pick([WORDS.long, WORDS.long, WORDS.epic]);
  }

  uniqueWord(wave) {
    const pool = this.wordPoolForWave(wave);
    // Words that merely share a starting letter (e.g. "smoke" / "sweet") are
    // allowed to coexist on purpose, so the prefix-disambiguation targeting in
    // typeLetter() comes into play. We only reject:
    //  - exact duplicates, and
    //  - words where one is a full prefix of the other (e.g. "boo" / "boom"),
    //    which would make the lock-on ambiguity impossible to resolve.
    const active = this.game.bombs.filter((bb) => !bb.dead).map((bb) => bb.word);
    for (let i = 0; i < 30; i++) {
      const w = pick(pool);
      const clash = active.some((aw) => aw === w || aw.startsWith(w) || w.startsWith(aw));
      if (!clash) return w;
    }
    return pick(pool);
  }

  // ---------- Wave control ----------
  startWave(wave) {
    const g = this.game;
    g.wave = wave;
    g.bombs = [];
    g.projectiles = [];
    g.lockedId = null;
    g.typedPrefix = '';
    g.waveTotal = 6 + wave * 2;
    g.waveCleared = 0;
    g.spawnQueue = g.waveTotal;
    g.spawnInterval = Math.max(0.55, 1.5 - wave * 0.08);
    g.spawnTimer = 0.4;
    this.updateProgress();
  }

  spawnBomb() {
    const { W, H } = this;
    const g = this.game;
    const margin = 70;
    let bestX = null, bestDist = -1;
    for (let i = 0; i < 16; i++) {
      const x = rand(margin, W - margin);
      let minD = Infinity;
      for (const b of g.bombs) {
        if (b.dead) continue;
        if (b.y < H * 0.58) minD = Math.min(minD, Math.abs(b.x - x));
      }
      if (minD === Infinity) minD = W;
      if (minD > bestDist) { bestDist = minD; bestX = x; }
    }
    const minGap = Math.max(104, W * 0.26);
    if (bestDist < minGap) return false; // too crowded near top — defer

    const word = this.uniqueWord(g.wave);
    const baseSpeed = 18 + g.wave * 3.2;
    g.bombs.push({
      id: this.bombSeq++,
      word, typed: 0,
      x: bestX,
      y: -20,
      vy: rand(baseSpeed, baseSpeed + 14) * this.TWEAKS.speedMul,
      drift: rand(-4, 4),
      r: 7,
      fuse: rand(0, Math.PI * 2),
      dead: false,
    });
    g.spawnQueue--;
    return true;
  }

  updateProgress() {
    const g = this.game;
    g.progressPct = g.waveTotal ? (g.waveCleared / g.waveTotal) * 100 : 0;
    this.emit();
  }

  // ---------- Input ----------
  handleKey(e) {
    if (this.state === STATE.PLAYING) {
      if (e.key === "Escape") { this.pauseGame(); return; }
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        this.typeLetter(e.key.toLowerCase());
      }
    } else if (this.state === STATE.PAUSED) {
      if (e.key === "Escape") this.resumeGame();
    } else if (this.state === STATE.GAMEOVER) {
      if (e.key === "Enter" || e.key === " ") this.startRun();
    } else if (this.state === STATE.TITLE) {
      if (e.key === "Enter") this.startRun();
    }
  }

  typeLetter(ch) {
    const g = this.game;
    g.keystrokes++;

    // Already committed to a single bomb — keep firing at it letter by letter.
    if (g.lockedId != null) {
      const target = g.bombs.find((b) => b.id === g.lockedId && !b.dead);
      if (target) {
        const expected = target.word[target.typed];
        if (expected === ch) {
          target.typed++;
          g.typedPrefix += ch;
          this.fireProjectile(target);
          if (target.typed >= target.word.length) this.destroyBomb(target);
          else this.emit();
        } else {
          g.errors++;
          g.multiplier = 1;
          this.emit();
        }
        return;
      }
      g.lockedId = null; // locked bomb is gone — fall through and re-acquire
    }

    // Acquisition / disambiguation. Match the typed prefix against every live
    // bomb. While MORE THAN ONE word shares the prefix we do NOT commit — we
    // light them all up and wait for the next letter to narrow it down. So
    // with "smoke" and "sweet" both falling, "s" keeps both lit; a following
    // "w" locks onto "sweet", an "m" locks onto "smoke".
    const prefix = g.typedPrefix + ch;
    const candidates = g.bombs.filter((b) => !b.dead && b.word.startsWith(prefix));

    if (candidates.length === 0) {
      // nothing matches the extended prefix — a genuine miss
      g.errors++;
      g.multiplier = 1;
      this.resetTargeting();
      this.emit();
      return;
    }

    g.typedPrefix = prefix;
    // Light up the matched prefix on every candidate; clear any non-match.
    for (const b of g.bombs) {
      b.typed = (!b.dead && b.word.startsWith(prefix)) ? prefix.length : 0;
    }

    if (candidates.length === 1) {
      // unambiguous — commit the lock and fire
      const target = candidates[0];
      g.lockedId = target.id;
      this.fireProjectile(target);
      if (target.typed >= target.word.length) this.destroyBomb(target);
      else this.emit();
    } else {
      // still ambiguous — candidates stay highlighted, await next letter
      this.emit();
    }
  }

  // Clear the in-progress targeting prefix and any candidate highlights.
  resetTargeting() {
    this.game.lockedId = null;
    this.game.typedPrefix = '';
    for (const b of this.game.bombs) b.typed = 0;
  }

  fireProjectile(target) {
    this.game.projectiles.push({
      x: this.shipX, y: this.shipY - 22,
      tx: target.x, ty: target.y,
      targetId: target.id,
      life: 0, dur: 0.18,
    });
    this.game.shipRecoil = 1;
  }

  destroyBomb(target) {
    const g = this.game;
    target.dead = true;
    g.lockedId = null;
    g.typedPrefix = '';
    g.wordsCleared++;
    g.waveCleared++;
    const gain = target.word.length * 5 * g.multiplier;
    g.score += gain;
    g.multiplier = Math.min(99, g.multiplier + 1);
    this.spawnExplosion(target.x, target.y);
    this.spawnFloater(target.x, target.y, "+" + gain);
    g.shake = Math.min(10, g.shake + 5);
    this.updateProgress(); // emits
  }

  spawnExplosion(x, y) {
    const accent = this.TWEAKS.accent;
    const g = this.game;
    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = rand(40, 230);
      g.particles.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0, dur: rand(0.4, 0.9),
        r: rand(1, 3.2),
        c: Math.random() < 0.55 ? accent : (Math.random() < 0.5 ? "#ffffff" : "#ff5e3a"),
      });
    }
    g.particles.push({ ring: true, x, y, life: 0, dur: 0.45, r0: 6, r1: 46, c: accent });
  }

  spawnFloater(x, y, text) {
    this.game.floaters.push({ x, y, text, life: 0, dur: 0.9 });
  }

  // ---------- Update ----------
  update(dt) {
    const g = this.game;
    if (this.state !== STATE.PLAYING) {
      g.shipPulse += dt;
      this.stepParticles(dt);
      return;
    }
    g.shipPulse += dt;
    g.shipRecoil = Math.max(0, g.shipRecoil - dt * 6);
    g.shake = Math.max(0, g.shake - dt * 28);

    // spawn
    if (g.spawnQueue > 0) {
      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        const maxConcurrent = Math.min(6, 3 + Math.floor(g.wave / 2));
        if (g.bombs.length >= maxConcurrent) {
          g.spawnTimer = 0.3; // field full — hold
        } else {
          const ok = this.spawnBomb();
          g.spawnTimer = ok ? g.spawnInterval * rand(0.75, 1.25) : 0.22;
        }
      }
    }

    // bombs
    let hitDanger = false;
    for (const b of g.bombs) {
      if (b.dead) continue;
      b.y += b.vy * dt;
      b.x += b.drift * dt;
      if (b.x < 30) { b.x = 30; b.drift = Math.abs(b.drift); }
      if (b.x > this.W - 30) { b.x = this.W - 30; b.drift = -Math.abs(b.drift); }
      b.fuse += dt * 8;
      if (b.y + b.r >= this.dangerY) { hitDanger = true; }
    }
    g.bombs = g.bombs.filter((b) => !b.dead);

    if (hitDanger) { this.gameOver(); return; }

    // projectiles
    for (const p of g.projectiles) {
      p.life += dt;
      const t = g.bombs.find((b) => b.id === p.targetId);
      if (t) { p.tx = t.x; p.ty = t.y; }
    }
    g.projectiles = g.projectiles.filter((p) => p.life < p.dur);

    this.stepParticles(dt);

    // wave complete?
    if (g.spawnQueue <= 0 && g.bombs.length === 0) {
      this.waveClear();
    }
  }

  stepParticles(dt) {
    const g = this.game;
    for (const p of g.particles) {
      p.life += dt;
      if (!p.ring) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.92; p.vy *= 0.92;
      }
    }
    g.particles = g.particles.filter((p) => p.life < p.dur);
    for (const f of g.floaters) { f.life += dt; f.y -= 26 * dt; }
    g.floaters = g.floaters.filter((f) => f.life < f.dur);
  }

  // ---------- Render ----------
  render() {
    const { ctx, W, H } = this;
    const g = this.game;
    ctx.clearRect(0, 0, W, H);

    let sx = 0, sy = 0;
    if (g.shake > 0.2) {
      sx = rand(-g.shake, g.shake) * 0.5;
      sy = rand(-g.shake, g.shake) * 0.5;
    }
    ctx.save();
    ctx.translate(sx, sy);

    if (this.bgCanvas) ctx.drawImage(this.bgCanvas, 0, 0, W, H);

    this.drawDangerLine();
    this.drawProjectiles();
    this.drawBombs();
    this.drawParticles();
    this.drawFloaters();
    this.drawTopFade();
    this.drawShip();

    ctx.restore();
  }

  drawTopFade() {
    const { ctx, W } = this;
    const h = 66;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(6,11,12,0.95)");
    g.addColorStop(0.55, "rgba(6,11,12,0.55)");
    g.addColorStop(1, "rgba(6,11,12,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, h);
  }

  drawDangerLine() {
    if (this.state === STATE.TITLE || this.state === STATE.HOWTO || this.state === STATE.SCORES) return;
    const { ctx, W, H, dangerY } = this;
    ctx.save();
    ctx.setLineDash([7, 9]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,77,94,0.5)";
    ctx.beginPath();
    ctx.moveTo(0, dangerY);
    ctx.lineTo(W, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);
    const g = ctx.createLinearGradient(0, dangerY, 0, H);
    g.addColorStop(0, "rgba(255,77,94,0.10)");
    g.addColorStop(1, "rgba(255,77,94,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, dangerY, W, H - dangerY);
    ctx.restore();
  }

  drawShip() {
    const { ctx } = this;
    const g = this.game;
    const pulse = 0.5 + 0.5 * Math.sin(g.shipPulse * 3);
    const recoil = g.shipRecoil * 4;
    ctx.save();
    ctx.translate(this.shipX, this.shipY);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const by = -4;
    const barrelLen = 16;
    const stroke = "#5cf0d4";

    // ----- barrel (kicks down on recoil) -----
    ctx.save();
    ctx.translate(0, recoil);
    ctx.shadowColor = "rgba(56,224,192,0.55)";
    ctx.shadowBlur = 10 + pulse * 5;
    ctx.fillStyle = "rgba(9,22,20,0.96)";
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;
    roundRect(ctx, -3, by - barrelLen, 6, barrelLen + 4, 2);
    ctx.fill(); ctx.stroke();
    roundRect(ctx, -5, by - barrelLen - 4, 10, 5, 1.5);
    ctx.fill(); ctx.stroke();
    if (g.shipRecoil > 0.05) {
      const f = g.shipRecoil;
      ctx.globalAlpha = f;
      ctx.fillStyle = this.TWEAKS.accent;
      ctx.shadowColor = this.TWEAKS.accent;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, by - barrelLen - 5, 2.5 + f * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // ----- turret dome -----
    ctx.shadowColor = "rgba(56,224,192,0.45)";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-12, by + 7);
    ctx.lineTo(-8, by - 1);
    ctx.lineTo(8, by - 1);
    ctx.lineTo(12, by + 7);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, by - 1, 0, by + 7);
    tg.addColorStop(0, "#16312b");
    tg.addColorStop(1, "#0b1c18");
    ctx.fillStyle = tg;
    ctx.fill(); ctx.stroke();

    // ----- chassis / hull -----
    roundRect(ctx, -19, by + 5, 38, 13, 3);
    const hg = ctx.createLinearGradient(0, by + 5, 0, by + 18);
    hg.addColorStop(0, "#142a26");
    hg.addColorStop(1, "#0a1613");
    ctx.fillStyle = hg;
    ctx.fill(); ctx.stroke();

    // tread studs
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(92,240,212," + (0.45 + pulse * 0.35) + ")";
    for (let i = -14; i <= 14; i += 7) {
      ctx.beginPath();
      ctx.arc(i, by + 16, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawProjectiles() {
    const { ctx } = this;
    ctx.save();
    for (const p of this.game.projectiles) {
      const t = Math.min(1, p.life / p.dur);
      const x = p.x + (p.tx - p.x) * t;
      const y = p.y + (p.ty - p.y) * t;
      const px = p.x + (p.tx - p.x) * Math.max(0, t - 0.18);
      const py = p.y + (p.ty - p.y) * Math.max(0, t - 0.18);
      ctx.strokeStyle = this.TWEAKS.accent;
      ctx.shadowColor = this.TWEAKS.accent;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBombs() {
    const { ctx, W } = this;
    const g = this.game;
    const fontPx = Math.max(15, Math.round(W * 0.034));
    for (const b of g.bombs) {
      const locked = b.id === g.lockedId;
      // A "candidate" is one of several bombs still matching the typed prefix
      // (ambiguous lock-on). It gets a dimmer version of the locked highlight.
      const candidate = !locked && b.typed > 0;
      const highlight = locked || candidate;
      const typedPart = b.word.slice(0, b.typed);
      const restPart = b.word.slice(b.typed);

      ctx.save();
      ctx.font = '600 ' + fontPx + 'px "JetBrains Mono", monospace';
      ctx.textBaseline = "middle";
      const restW = ctx.measureText(restPart).width;
      const typedW = ctx.measureText(typedPart).width;
      const totalW = restW + typedW;
      const bombR = b.r;
      const wordX = b.x - totalW / 2;
      const wordY = b.y - 18;

      // locked / candidate highlight pill (candidates are dimmer)
      if (highlight) {
        ctx.fillStyle = locked ? "rgba(255,157,46,0.10)" : "rgba(255,157,46,0.06)";
        roundRect(ctx, wordX - 9, wordY - fontPx * 0.62, totalW + 18, fontPx * 1.24, 6);
        ctx.fill();
        ctx.strokeStyle = locked ? "rgba(255,157,46,0.45)" : "rgba(255,157,46,0.28)";
        ctx.lineWidth = 1;
        roundRect(ctx, wordX - 9, wordY - fontPx * 0.62, totalW + 18, fontPx * 1.24, 6);
        ctx.stroke();
      }

      // typed (consumed) letters — accent, dim
      ctx.textAlign = "left";
      if (typedPart) {
        ctx.fillStyle = this.TWEAKS.accent;
        ctx.globalAlpha = 0.55;
        ctx.fillText(typedPart, wordX, wordY);
        ctx.globalAlpha = 1;
      }
      // remaining letters — white (or accent if locked)
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = highlight ? "#ffffff" : "#e7eeed";
      ctx.fillText(restPart, wordX + typedW, wordY);
      ctx.shadowBlur = 0;

      // bomb icon
      const ix = b.x, iy = b.y + fontPx * 0.5;
      this.drawBombIcon(ix, iy, bombR, highlight, b.fuse);

      ctx.restore();
    }
  }

  drawBombIcon(x, y, r, locked, fuse) {
    const { ctx } = this;
    ctx.save();
    // body
    const grd = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r * 1.4);
    grd.addColorStop(0, locked ? "#3a2a14" : "#1a2422");
    grd.addColorStop(1, locked ? "#160d04" : "#0b110f");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // ring
    ctx.strokeStyle = locked ? "rgba(255,157,46,0.9)" : "rgba(90,240,212,0.55)";
    ctx.lineWidth = 1.4;
    ctx.shadowColor = locked ? this.TWEAKS.accent : "rgba(90,240,212,0.6)";
    ctx.shadowBlur = locked ? 10 : 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // fuse spark
    const fx = x + r * 0.7, fy = y - r * 0.9;
    ctx.strokeStyle = "rgba(160,170,170,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.4, y - r * 0.7);
    ctx.quadraticCurveTo(x + r * 1.1, y - r * 1.1, fx, fy);
    ctx.stroke();
    const flick = 1.6 + Math.sin(fuse) * 0.8;
    ctx.fillStyle = "#ffd27a";
    ctx.shadowColor = "#ff9d2e";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(fx, fy, flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawParticles() {
    const { ctx } = this;
    ctx.save();
    for (const p of this.game.particles) {
      const t = p.life / p.dur;
      if (p.ring) {
        const r = p.r0 + (p.r1 - p.r0) * t;
        ctx.globalAlpha = (1 - t) * 0.7;
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 2 * (1 - t) + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawFloaters() {
    const { ctx } = this;
    ctx.save();
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    for (const f of this.game.floaters) {
      const t = f.life / f.dur;
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.fillStyle = this.TWEAKS.accent;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---------- Loop ----------
  loop(t) {
    if (!this.running) return;
    if (!this.lastT) this.lastT = t;
    let dt = (t - this.lastT) / 1000;
    this.lastT = t;
    if (dt > 0.05) dt = 0.05; // clamp
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this._loop);
  }

  // ---------- Screen transitions / actions ----------
  startRun() {
    const g = this.game;
    if (this.waveClearTimer) { clearTimeout(this.waveClearTimer); this.waveClearTimer = null; }
    g.score = 0;
    g.multiplier = 1;
    g.wave = 1;
    g.particles = [];
    g.floaters = [];
    g.keystrokes = 0;
    g.errors = 0;
    g.wordsCleared = 0;
    g.runStart = performance.now();
    this.showScreen(null);
    this.startWave(1);
    this.setState(STATE.PLAYING);
    this.emit();
  }

  waveClear() {
    this.setState(STATE.WAVECLEAR);
    this.showScreen("waveclear");
    this.waveClearTimer = setTimeout(() => {
      this.waveClearTimer = null;
      if (this.state !== STATE.WAVECLEAR) return;
      this.showScreen(null);
      this.startWave(this.game.wave + 1);
      this.setState(STATE.PLAYING);
      this.emit();
    }, 1900);
  }

  pauseGame() {
    if (this.state !== STATE.PLAYING) return;
    this.setState(STATE.PAUSED);
    this.showScreen("pause");
  }

  resumeGame() {
    if (this.state !== STATE.PAUSED) return;
    this.showScreen(null);
    this.setState(STATE.PLAYING);
    this.emit();
  }

  togglePause() {
    if (this.state === STATE.PLAYING) this.pauseGame();
    else if (this.state === STATE.PAUSED) this.resumeGame();
  }

  gameOver() {
    const g = this.game;
    this.setState(STATE.GAMEOVER);
    if (g.score > this.best.score) this.best.score = g.score;
    if (g.wave > this.best.wave) this.best.wave = g.wave;
    saveBest(this.best);
    this.spawnExplosion(this.shipX, this.shipY);
    g.shake = 12;
    this.showScreen("gameover");
  }

  quitToMenu() {
    if (this.waveClearTimer) { clearTimeout(this.waveClearTimer); this.waveClearTimer = null; }
    this.setState(STATE.TITLE);
    this.game.bombs = [];
    this.game.projectiles = [];
    this.game.lockedId = null;
    this.game.typedPrefix = '';
    this.showScreen("title");
  }

  showHowto() { this.setState(STATE.HOWTO); this.showScreen("howto"); }
  showScores() { this.setState(STATE.SCORES); this.showScreen("scores"); }
  back() { this.setState(STATE.TITLE); this.showScreen("title"); }

  // Dispatch for [data-action] buttons in the React overlays.
  action(name) {
    if (name === "start") this.startRun();
    else if (name === "howto") this.showHowto();
    else if (name === "scores") this.showScores();
    else if (name === "back") this.back();
    else if (name === "resume") this.resumeGame();
    else if (name === "quit") this.quitToMenu();
  }
}
