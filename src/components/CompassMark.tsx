interface CompassMarkProps {
  size?: number;
  className?: string;
}

// 罗盘花品牌符号：陶土指针 + 黄铜环
export default function CompassMark({ size = 36, className }: CompassMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <circle cx="24" cy="24" r="14.5" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      {/* 刻度 */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const r1 = i % 6 === 0 ? 18.5 : 20;
        const x1 = 24 + r1 * Math.sin(rad);
        const y1 = 24 - r1 * Math.cos(rad);
        const x2 = 24 + 21 * Math.sin(rad);
        const y2 = 24 - 21 * Math.cos(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={i % 6 === 0 ? 1.2 : 0.6}
            opacity="0.5"
          />
        );
      })}
      {/* 南北指针：陶土/墨色 */}
      <path d="M24 7 L28.2 24 L24 21.4 L19.8 24 Z" fill="#BE5A38" />
      <path d="M24 41 L19.8 24 L24 26.6 L28.2 24 Z" fill="currentColor" opacity="0.82" />
      <circle cx="24" cy="24" r="2.1" fill="currentColor" />
    </svg>
  );
}
