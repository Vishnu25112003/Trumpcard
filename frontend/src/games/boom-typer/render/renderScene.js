import { renderBoom } from './renderBoom';
import { renderExplosion } from './renderExplosion';
import { renderLetterShot } from './renderLetterShot';
import { renderTanker } from './renderTanker';

export function renderScene(ctx, state, now) {
  ctx.clearRect(0, 0, state.width, state.height);
  renderBackground(ctx, state);

  state.booms
    .filter((boom) => boom.status !== 'dead' && boom.status !== 'blasting')
    .sort((a, b) => a.y - b.y)
    .forEach((boom) => renderBoom(ctx, boom, now));

  state.letters.forEach((shot) => renderLetterShot(ctx, shot));
  state.explosions.forEach((explosion) => renderExplosion(ctx, explosion));
  renderTanker(ctx, state);
}

function renderBackground(ctx, state) {
  const bg = ctx.createLinearGradient(0, 0, 0, state.height);
  bg.addColorStop(0, '#06021a');
  bg.addColorStop(0.48, '#14083c');
  bg.addColorStop(1, '#05020d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.strokeStyle = 'rgba(154, 92, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= state.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, state.height);
    ctx.stroke();
  }
  for (let y = 34; y <= state.height; y += 68) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let index = 0; index < 54; index += 1) {
    const x = (index * 173) % state.width;
    const y = (index * 89) % 420;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  ctx.strokeStyle = '#ff4d6d';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(36, state.bottomLine);
  ctx.lineTo(state.width - 36, state.bottomLine);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(255,77,109,0.12)';
  ctx.fillRect(0, state.bottomLine, state.width, state.height - state.bottomLine);
}
