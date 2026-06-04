import { TUNING } from '../config/tuning';

export function renderLetterShot(ctx, shot) {
  const progress = Math.min(1, shot.ageMs / TUNING.projectile.ttlMs);
  const eased = 1 - (1 - progress) ** 3;
  const x = lerp(shot.fromX, shot.toX, eased);
  const y = lerp(shot.fromY, shot.toY, eased);

  ctx.save();
  ctx.globalAlpha = 1 - Math.max(0, progress - 0.75) / 0.25;
  ctx.strokeStyle = 'rgba(94,236,255,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shot.fromX, shot.fromY);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.fillStyle = '#e8fbff';
  ctx.shadowBlur = 16;
  ctx.shadowColor = '#5eecff';
  ctx.font = "900 22px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shot.char.toUpperCase(), x, y);
  ctx.restore();
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
