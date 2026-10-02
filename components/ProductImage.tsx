// Placeholder artwork until Ladli Toys supplies real product photos.
// Swap the body for <Image src=... /> once images are uploaded to object storage.
export default function ProductImage({
  emoji, colors, view = 0, className = "",
}: { emoji: string; colors: [string, string]; view?: number; className?: string }) {
  const angle = [135, 45, 225, 315][view % 4];
  const size = ["text-7xl", "text-8xl", "text-6xl", "text-9xl"][view % 4];
  return (
    <div
      role="img" aria-label="Product image"
      className={`flex aspect-square items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]})` }}
    >
      <span className={`${size} drop-shadow-md`} style={{ transform: `rotate(${(view % 3) * 8 - 8}deg)` }}>{emoji}</span>
    </div>
  );
}
