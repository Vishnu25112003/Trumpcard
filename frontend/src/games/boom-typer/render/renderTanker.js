export function renderTanker(ctx, state) {
  const target = state.booms.find((boom) => boom.id === state.lockedBoomId);
  const x = state.width / 2;
  const y = state.tankerY;
  const angle = target ? Math.atan2(target.y - y, target.x - x) : -Math.PI / 2;

  ctx.save();
  ctx.translate(x, y);

  ctx.rotate(angle);
  ctx.fillStyle = '#b884ff';
  ctx.shadowBlur = 16;
  ctx.shadowColor = '#9a5cff';
  roundRect(ctx, 0, -8, 82, 16, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffe585';
  roundRect(ctx, 54, -5, 24, 10, 5);
  ctx.fill();
  ctx.rotate(-angle);

  const hull = ctx.createLinearGradient(-72, -20, 72, 26);
  hull.addColorStop(0, '#2e1370');
  hull.addColorStop(0.5, '#6b2cd4');
  hull.addColorStop(1, '#100432');
  ctx.fillStyle = hull;
  ctx.strokeStyle = '#f0c750';
  ctx.lineWidth = 2;
  roundRect(ctx, -72, -18, 144, 38, 13);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0a0220';
  for (let index = -2; index <= 2; index += 1) {
    ctx.beginPath();
    ctx.arc(index * 25, 22, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#5eecff';
  ctx.font = "800 12px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TYPE', 0, 0);
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
