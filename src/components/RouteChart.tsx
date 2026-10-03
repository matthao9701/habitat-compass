import { useMemo } from 'react';
import type { City } from '../data/types';
import { useI18n } from '../i18n';

// 经纬度（近似，用于示意性海图，非精确投影）
const COORDS: Record<string, [number, number]> = {
  lisbon: [-9.1, 38.7],
  porto: [-8.6, 41.1],
  madeira: [-16.9, 32.6],
  barcelona: [2.2, 41.4],
  mallorca: [2.65, 39.57],
  valencia: [-0.38, 39.47],
  madrid: [-3.7, 40.4],
  split: [16.4, 43.5],
  zagreb: [15.98, 45.8],
  athens: [23.7, 38],
  budapest: [19.04, 47.5],
  prague: [14.4, 50.07],
  berlin: [13.4, 52.52],
  tbilisi: [44.8, 41.7],
  istanbul: [28.98, 41.01],
  florence: [11.25, 43.77],
  tallinn: [24.75, 59.44],
  'mexico-city': [-99.13, 19.43],
  merida: [-89.62, 20.97],
  'playa-del-carmen': [-87.07, 20.63],
  medellin: [-75.57, 6.24],
  bogota: [-74.07, 4.71],
  'buenos-aires': [-58.38, -34.6],
  rio: [-43.2, -22.9],
  lima: [-77.04, -12.05],
  marrakech: [-8, 31.63],
  'cape-town': [18.42, -33.92],
  bangkok: [100.5, 13.75],
  'chiang-mai': [98.98, 18.79],
  phuket: [98.39, 7.88],
  bali: [115.1, -8.4],
  penang: [100.3, 5.4],
  'kuala-lumpur': [101.69, 3.14],
  singapore: [103.8, 1.35],
  'ho-chi-minh': [106.63, 10.82],
  'da-nang': [108.22, 16.05],
  tokyo: [139.69, 35.69],
  seoul: [126.98, 37.57],
  taipei: [121.56, 25.03],
};

const W = 1000;
const H = 500;

function project(lng: number, lat: number): [number, number] {
  return [((lng + 180) / 360) * W, ((90 - lat) / 180) * H];
}

interface RouteChartProps {
  cities: City[];
  className?: string;
  highlightId?: string;
  /** 航线锚点序列（城市 id），默认用 5 个大洲代表点 */
  routes?: string[][];
  compact?: boolean;
}

const DEFAULT_ROUTES: string[][] = [
  ['lisbon', 'split', 'tbilisi', 'dubai-placeholder'],
  ['rio', 'lima', 'medellin', 'mexico-city'],
  ['lisbon', 'marrakech', 'cape-town'],
  ['singapore', 'bali', 'bangkok', 'tokyo'],
  ['mexico-city', 'barcelona', 'berlin'],
];

export default function RouteChart({
  cities,
  className,
  highlightId,
  routes = DEFAULT_ROUTES,
  compact = false,
}: RouteChartProps) {
  const { t } = useI18n();
  const { points, paths } = useMemo(() => {
    const byId = new Map(cities.map((c) => [c.id, c]));
    const points = cities
      .map((c) => {
        const coord = COORDS[c.id];
        if (!coord) return null;
        const [x, y] = project(coord[0], coord[1]);
        return { id: c.id, x, y };
      })
      .filter((p): p is { id: string; x: number; y: number } => p !== null);

    const paths = routes.map((chain) =>
      chain
        .map((id) => {
          const coord = COORDS[id];
          if (!coord) return null;
          return project(coord[0], coord[1]);
        })
        .filter((p): p is [number, number] => p !== null),
    );

    void byId;
    return { points, paths };
  }, [cities, routes]);

  const graticules = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; vertical: boolean }[] = [];
    for (let lng = -150; lng <= 150; lng += 30) {
      const [x] = project(lng, 0);
      lines.push({ x1: x, y1: 0, x2: x, y2: H, vertical: true });
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const [, y] = project(0, lat);
      lines.push({ x1: 0, y1: y, x2: W, y2: y, vertical: false });
    }
    return lines;
  }, []);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={t('route.aria')}
    >
      {/* 经纬网 */}
      {graticules.map((g, i) => (
        <line
          key={i}
          x1={g.x1}
          y1={g.y1}
          x2={g.x2}
          y2={g.y2}
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.18"
        />
      ))}

      {/* 航线 */}
      {paths.map((chain, i) => {
        const d = chain
          .map(([x, y], j) => {
            if (j === 0) return `M ${x} ${y}`;
            const [px, py] = chain[j - 1];
            const mx = (px + x) / 2;
            const my = Math.min(py, y) - 26;
            return `Q ${mx} ${my} ${x} ${y}`;
          })
          .join(' ');
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={compact ? '#F0F7FA' : '#E76F51'}
            strokeWidth="1.1"
            strokeDasharray="5 7"
            opacity="0.7"
            className="animate-dash-drift"
          />
        );
      })}

      {/* 城市点 */}
      {points.map((p) => {
        const active = p.id === highlightId;
        return (
          <g key={p.id}>
            {active && (
              <circle cx={p.x} cy={p.y} r="7" stroke={compact ? '#F0F7FA' : '#E76F51'} strokeWidth="0.9" opacity="0.7" />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={active ? 3.2 : 2}
              fill={active ? '#E76F51' : compact ? '#F0F7FA' : '#0A2530'}
              opacity={active ? 1 : 0.62}
            />
          </g>
        );
      })}
    </svg>
  );
}
