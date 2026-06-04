export default function LevelTransition({ level }) {
  if (!level) return null;

  return (
    <div className="bt-level-banner">
      <span>Level {level}</span>
    </div>
  );
}
