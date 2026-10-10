/**
 * 首页 Hero 装饰：现代海图「方位罗盘花」（纯几何 SVG，零图片体积）。
 * 依据 DESIGN.md「Hero 与报告头可用海蓝微渐变或纯几何波浪 SVG 装饰」——
 * 以同心方位环 + 刻度 + 八向罗盘花 + 陶土虚线航线构成，与品牌罗盘符号同源。
 * 仅为氛围层：aria-hidden、pointer-events-none，桌面端（lg+）显示，移动端隐藏以免挤压首屏 CTA。
 */
export default function HeroChart({ className }: { className?: string }) {
  const cx = 240;
  const cy = 240;

  // 方位刻度环：每 5° 一格，30° 为主刻度（加长加深）
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const rad = ((i * 5) * Math.PI) / 180;
    const major = i % 6 === 0;
    const inner = major ? 176 : 189;
    return {
      x1: cx + inner * Math.sin(rad),
      y1: cy - inner * Math.cos(rad),
      x2: cx + 200 * Math.sin(rad),
      y2: cy - 200 * Math.cos(rad),
      major,
    };
  });

  return (
    <svg viewBox="0 0 480 480" fill="none" className={className} aria-hidden="true">
      {/* 同心方位环 */}
      <g stroke="currentColor">
        <circle cx={cx} cy={cy} r="200" strokeWidth="1" opacity="0.55" />
        <circle cx={cx} cy={cy} r="168" strokeWidth="0.6" opacity="0.4" />
        <circle cx={cx} cy={cy} r="118" strokeWidth="0.6" opacity="0.3" />
        {/* 主方位十字（虚线） */}
        <g strokeDasharray="2 6" opacity="0.35">
          <line x1={cx} y1={cy - 200} x2={cx} y2={cy + 200} />
          <line x1={cx - 200} y1={cy} x2={cx + 200} y2={cy} />
        </g>
      </g>

      {/* 刻度 */}
      <g stroke="currentColor">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={t.major ? 1 : 0.6}
            opacity={t.major ? 0.6 : 0.32}
          />
        ))}
      </g>

      {/* 八向罗盘花：四主向（北为陶土）+ 四隅向 */}
      <g>
        {[0, 90, 180, 270].map((deg) => (
          <path
            key={deg}
            d="M240 172 L252 240 L240 230 L228 240 Z"
            transform={`rotate(${deg} ${cx} ${cy})`}
            fill={deg === 0 ? '#C96A52' : 'currentColor'}
            opacity={deg === 0 ? 0.9 : 0.7}
          />
        ))}
        {[45, 135, 225, 315].map((deg) => (
          <path
            key={deg}
            d="M240 206 L247 240 L240 234 L233 240 Z"
            transform={`rotate(${deg} ${cx} ${cy})`}
            fill="currentColor"
            opacity="0.45"
          />
        ))}
        <circle cx={cx} cy={cy} r="3" fill="currentColor" opacity="0.7" />
      </g>

      {/* 陶土虚线航线 + 锚点 */}
      <path
        d="M24 392 C 148 358 206 296 266 230 C 318 172 372 138 456 116"
        stroke="#C96A52"
        strokeWidth="1.1"
        strokeDasharray="5 8"
        opacity="0.5"
      />
      <g fill="#C96A52">
        {[
          [24, 392],
          [266, 230],
          [456, 116],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 1 ? 3.4 : 2.4} opacity="0.7" />
        ))}
      </g>
    </svg>
  );
}
