export default function Projectile({ projectile }) {
  return (
    <div
      className="tg-projectile"
      style={{ left: projectile.x, top: projectile.y }}
    />
  );
}
