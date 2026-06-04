import { TUNING } from '../config/tuning';

export function createExplosion(boom) {
  return {
    id: `explosion-${boom.id}`,
    x: boom.x,
    y: boom.y,
    radius: boom.radius,
    ageMs: 0,
    color: boom.type === 'power' ? '#ff5d9e' : '#f0c750',
    sparks: Array.from({ length: TUNING.explosion.particles }, (_, index) => ({
      angle: (Math.PI * 2 * index) / TUNING.explosion.particles + Math.random() * 0.35,
      speed: 38 + Math.random() * 58,
      size: 2 + Math.random() * 4,
    })),
  };
}

export function renderExplosion(ctx, explosion) {
  const progress = Math.min(1, explosion.ageMs / TUNING.explosion.ttlMs);
  const alpha = 1 - progress;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = explosion.color;
  ctx.lineWidth = 4;
  ctx.shadowBlur = 22;
  ctx.shadowColor = explosion.color;
  ctx.beginPath();
  ctx.arc(explosion.x, explosion.y, explosion.radius + progress * 36, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffe585';
  explosion.sparks.forEach((spark) => {
    const distance = spark.speed * progress;
    ctx.beginPath();
    ctx.arc(
      explosion.x + Math.cos(spark.angle) * distance,
      explosion.y + Math.sin(spark.angle) * distance,
      spark.size * alpha,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });
  ctx.restore();
}
