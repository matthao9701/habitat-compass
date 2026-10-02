interface RadarSeries {
  id: string;
  label: string;
  color: string;
  values: number[];
}

interface RadarChartProps {
  axes: string[];
  series: RadarSeries[];
  size?: number;
}

// 六维雷达图（纯 SVG）
export default function RadarChart({ axes, series, size = 340 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const n = axes.length;

  function pointFor(axisIndex: number, value: number): [number, number] {
    const angle = (Math.PI * 2 * axisIndex) / n - Math.PI / 2;
    const r = (value / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  function polygon(values: number[]): string {
    return values.map((v, i) => pointFor(i, v).join(',')).join(' ');
  }

  return (
    <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-center md:gap-8">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Top 3 城市六维对比雷达图"
        className="max-w-full"
      >
        {/* 网格环 */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={axes
              .map((_, i) => {
                const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                return [cx + radius * ratio * Math.cos(angle), cy + radius * ratio * Math.sin(angle)].join(',');
              })
              .join(' ')}
            fill="none"
            stroke="#1F2D28"
            strokeWidth="0.7"
            opacity="0.16"
          />
        ))}

        {/* 轴线 */}
        {axes.map((_, i) => {
          const [x, y] = pointFor(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#1F2D28"
              strokeWidth="0.7"
              opacity="0.16"
            />
          );
        })}

        {/* 数据多边形 */}
        {series.map((s) => (
          <polygon
            key={s.id}
            points={polygon(s.values)}
            fill={s.color}
            fillOpacity="0.1"
            stroke={s.color}
            strokeWidth="1.6"
          />
        ))}

        {/* 数据点 */}
        {series.map((s) =>
          s.values.map((v, i) => {
            const [x, y] = pointFor(i, v);
            return <circle key={`${s.id}-${i}`} cx={x} cy={y} r="2.4" fill={s.color} />;
          }),
        )}

        {/* 轴标签 */}
        {axes.map((label, i) => {
          const [x, y] = pointFor(i, 122);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink"
              style={{ fontSize: 12, fontFamily: '"IBM Plex Mono", monospace' }}
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* 图例 */}
      <ul className="flex flex-col gap-2.5 self-center md:self-auto">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-mono text-[12px] text-ink">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
