export function renderBoom(ctx, boom, now) {
  const isLocked = boom.status === 'locked';
  const pulse = Math.sin((now + boom.pulseSeed) / 180) * 0.5 + 0.5;
  const radius = boom.radius + (isLocked ? 3 : 0);
  const typed = boom.word.slice(0, boom.typedIndex);
  const remaining = boom.word.slice(boom.typedIndex);

  ctx.save();
  ctx.translate(boom.x, boom.y);

  const gradient = ctx.createRadialGradient(-10, -12, 6, 0, 0, radius);
  gradient.addColorStop(0, boom.type === 'power' ? '#fff4b0' : '#ffffff');
  gradient.addColorStop(0.35, boom.type === 'power' ? '#ff5d9e' : '#ff4d6d');
  gradient.addColorStop(1, boom.type === 'power' ? '#68175d' : '#5f1120');

  ctx.shadowBlur = boom.type === 'power' ? 22 + pulse * 16 : 12;
  ctx.shadowColor = boom.type === 'power' ? '#ff5d9e' : '#ff4d6d';
  ctx.fillStyle = gradient;
  drawBombShape(ctx, radius);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = isLocked ? 4 : 2;
  ctx.strokeStyle = isLocked ? '#ffe585' : boom.type === 'power' ? '#ffbdd7' : 'rgba(255,255,255,0.5)';
  ctx.stroke();

  drawFuse(ctx, radius, boom.type === 'power', pulse);

  if (boom.type === 'power') {
    ctx.fillStyle = '#17051f';
    ctx.font = "700 12px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`x${boom.tier}`, 0, -radius + 13);
  }

  if (boom.emitFlashMs > 0) {
    ctx.globalAlpha = boom.emitFlashMs / 260;
    ctx.strokeStyle = '#ffe585';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 16 * (1 - boom.emitFlashMs / 260), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.font = "800 18px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const totalWidth = ctx.measureText(boom.word).width;
  const typedWidth = ctx.measureText(typed).width;
  const startX = -totalWidth / 2;

  ctx.fillStyle = '#1f0826';
  ctx.fillText(boom.word, 1, 20);
  ctx.fillStyle = '#5ee08a';
  ctx.fillText(typed, startX + typedWidth / 2, 19);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(remaining, startX + typedWidth + ctx.measureText(remaining).width / 2, 19);

  ctx.restore();
}

function drawBombShape(ctx, radius) {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.moveTo(radius * 0.48, -radius * 0.72);
  ctx.quadraticCurveTo(radius * 0.78, -radius * 1.05, radius * 0.98, -radius * 0.58);
}

function drawFuse(ctx, radius, isPower, pulse) {
  ctx.strokeStyle = isPower ? '#ffe585' : '#d9ccff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(radius * 0.5, -radius * 0.72);
  ctx.quadraticCurveTo(radius * 0.76, -radius * 1.08, radius * 1.03, -radius * 0.95);
  ctx.stroke();

  ctx.fillStyle = isPower ? '#ffe585' : '#f0c750';
  ctx.shadowBlur = isPower ? 18 + pulse * 10 : 10;
  ctx.shadowColor = ctx.fillStyle;
  ctx.beginPath();
  ctx.arc(radius * 1.08, -radius * 0.95, 5 + pulse * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}
