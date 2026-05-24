export default function LivesIndicator({ lives, max = 3, size = 'sm' }) {
  const heartSize = size === 'lg' ? 'text-xl' : 'text-sm';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`${heartSize} transition-all duration-300 ${
            i < lives ? 'opacity-100' : 'opacity-20 grayscale'
          }`}
        >
          ❤️
        </span>
      ))}
    </div>
  );
}
