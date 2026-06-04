import { TUNING } from '../config/tuning';
import { createExplosion } from '../render/renderExplosion';
import { renderScene } from '../render/renderScene';
import { buildLevelState } from './levels';
import { updatePowerBooms } from './powerBoom';
import { resetIds, spawnNormalBoom, spawnPowerBoom } from './spawner';
import { handleLetterKey } from './targeting';

export class BoomTyperEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.rafId = null;
    this.lastFrameAt = 0;
    this.lastUiSyncAt = 0;
    this.running = false;

    canvas.width = TUNING.world.width;
    canvas.height = TUNING.world.height;
    resetIds();

    this.state = {
      status: 'playing',
      width: TUNING.world.width,
      height: TUNING.world.height,
      bottomLine: TUNING.world.bottomLine,
      tankerY: TUNING.world.tankerY,
      dropSpeed: TUNING.world.dropSpeed,
      booms: [],
      letters: [],
      explosions: [],
      lockedBoomId: null,
      elapsedMs: 0,
      lastSpawnAt: 0,
      nextNormalSpawnAt: TUNING.spawn.firstSpawnDelayMs,
      nextProjectileId: 1,
      finalLevel: 1,
      bannerLevel: null,
      bannerUntil: 0,
      events: {
        onBoomSpawned: callbacks.onBoomSpawned,
        onLetterTyped: callbacks.onLetterTyped,
        onWordCompleted: callbacks.onWordCompleted,
        onBoomLanded: callbacks.onBoomLanded,
        onLevelUp: callbacks.onLevelUp,
        onGameOver: callbacks.onGameOver,
      },
      ...buildLevelState(1),
    };
  }

  start() {
    this.running = true;
    this.syncUi(0, true);
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  handleKey(char) {
    this.clearInvalidLock();
    return handleLetterKey(this.state, char, performance.now());
  }

  loop = (now) => {
    if (!this.running) return;

    if (!this.lastFrameAt) this.lastFrameAt = now;
    const dtMs = Math.min(TUNING.loop.maxDtMs, now - this.lastFrameAt);
    this.lastFrameAt = now;

    if (this.state.status === 'playing') {
      this.update(dtMs, now);
    }

    renderScene(this.ctx, this.state, now);
    this.syncUi(now);
    this.rafId = requestAnimationFrame(this.loop);
  };

  update(dtMs, now) {
    const state = this.state;
    state.elapsedMs += dtMs;

    state.booms.forEach((boom) => {
      if (boom.status === 'blasting' || boom.status === 'dead') {
        boom.blastAgeMs += dtMs;
        return;
      }

      boom.y += boom.speed * (dtMs / 1000);
      if (boom.emitFlashMs > 0) {
        boom.emitFlashMs = Math.max(0, boom.emitFlashMs - dtMs);
      }
    });

    updatePowerBooms(state, now);
    this.spawnNormalIfReady(now);
    this.queuePowerBoomsIfReady(now);
    this.spawnQueuedPowerBoom(now);

    const landed = state.booms.find((boom) => boom.status !== 'dead' && boom.status !== 'blasting' && boom.y + boom.radius >= state.bottomLine);
    if (landed) {
      state.events.onBoomLanded?.(landed);
      this.gameOver();
      return;
    }

    this.updateEffects(dtMs);
    this.removeDeadBooms();
    this.clearInvalidLock();

    if (state.boomsClearedThisLevel >= state.boomsGoalThisLevel) {
      this.nextLevel(now);
    }
  }

  spawnNormalIfReady(now) {
    const state = this.state;
    const liveBooms = state.booms.filter((boom) => boom.status !== 'dead' && boom.status !== 'blasting');
    if (now < state.nextNormalSpawnAt) return;
    if (liveBooms.length >= state.maxBoomsOnScreen) return;

    spawnNormalBoom(state, now);
    state.lastSpawnAt = now;
    state.nextNormalSpawnAt = now + state.spawnIntervalMs;
  }

  queuePowerBoomsIfReady(now) {
    const state = this.state;
    if (state.powerQueued || state.pendingPowerTiers.length === 0) return;
    const trigger = Math.ceil(state.boomsGoalThisLevel * TUNING.spawn.powerTriggerRatio);
    if (state.boomsClearedThisLevel < trigger) return;

    state.powerQueued = true;
    state.nextPowerSpawnAt = now;
  }

  spawnQueuedPowerBoom(now) {
    const state = this.state;
    if (!state.powerQueued || state.pendingPowerTiers.length === 0) return;
    if (now < state.nextPowerSpawnAt) return;

    const tier = state.pendingPowerTiers.shift();
    spawnPowerBoom(state, tier, now);
    state.nextPowerSpawnAt = now + TUNING.spawn.powerSpawnGapMs;
  }

  updateEffects(dtMs) {
    const state = this.state;
    state.letters.forEach((shot) => {
      shot.ageMs += dtMs;
    });
    state.letters = state.letters.filter((shot) => shot.ageMs < TUNING.projectile.ttlMs);

    state.booms.forEach((boom) => {
      if (boom.status === 'blasting' && !boom.explosionCreated) {
        state.explosions.push(createExplosion(boom));
        boom.explosionCreated = true;
      }
    });

    state.explosions.forEach((explosion) => {
      explosion.ageMs += dtMs;
    });
    state.explosions = state.explosions.filter((explosion) => explosion.ageMs < TUNING.explosion.ttlMs);
  }

  removeDeadBooms() {
    const state = this.state;
    state.booms.forEach((boom) => {
      if (boom.status === 'blasting' && boom.blastAgeMs >= TUNING.explosion.ttlMs) {
        boom.status = 'dead';
      }
    });
    state.booms = state.booms.filter((boom) => boom.status !== 'dead');
  }

  clearInvalidLock() {
    const locked = this.state.booms.find((boom) => boom.id === this.state.lockedBoomId);
    if (!locked || (locked.status !== 'falling' && locked.status !== 'locked')) {
      this.state.lockedBoomId = null;
    }
  }

  nextLevel(now) {
    const previous = this.state;
    const next = buildLevelState(previous.level + 1);
    Object.assign(previous, next, {
      booms: previous.booms,
      letters: previous.letters,
      explosions: previous.explosions,
      lockedBoomId: previous.lockedBoomId,
      elapsedMs: previous.elapsedMs,
      nextNormalSpawnAt: Math.min(previous.nextNormalSpawnAt, now + previous.spawnIntervalMs),
      bannerLevel: next.level,
      bannerUntil: now + TUNING.levelBannerMs,
    });
    previous.events.onLevelUp?.(next.level);
    this.syncUi(now, true);
  }

  gameOver() {
    this.state.status = 'gameover';
    this.state.finalLevel = this.state.level;
    this.state.lockedBoomId = null;
    this.state.events.onGameOver?.(this.state.finalLevel);
    this.syncUi(performance.now(), true);
  }

  syncUi(now, force = false) {
    if (!force && now - this.lastUiSyncAt < 150) return;
    this.lastUiSyncAt = now;
    const locked = this.state.booms.find((boom) => boom.id === this.state.lockedBoomId);
    this.callbacks.onUpdate?.({
      status: this.state.status,
      level: this.state.level,
      finalLevel: this.state.finalLevel,
      boomsClearedThisLevel: this.state.boomsClearedThisLevel,
      boomsGoalThisLevel: this.state.boomsGoalThisLevel,
      liveBoomCount: this.state.booms.filter((boom) => boom.status !== 'dead' && boom.status !== 'blasting').length,
      maxBoomsOnScreen: this.state.maxBoomsOnScreen,
      lockedWord: locked?.word ?? null,
      lockedTypedIndex: locked?.typedIndex ?? 0,
      bannerLevel: this.state.bannerUntil > now ? this.state.bannerLevel : null,
    });
  }
}
