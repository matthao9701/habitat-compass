/**
 * 极简数据终端风六维罗盘雷达图（SVG，细线 1px）。
 * 六维：生活成本 / 税优 / 网速基建 / 社群活力 / 气候 / 签证门槛。
 * 值域 0-100；null 维不编造，绘图时以 0 长度 + 空心点表示并标注「—」。
 * 维度标签本地化：CompassDatum.label 存 i18n 键，渲染时按当前语言输出。
 */
import { useI18n } from '../../i18n';

export interface CompassDatum {
  /** i18n 键（如 atlas.radar.cost），渲染时按语言翻译 */
  label: string;
  /** 0-100；null 表示数据缺失（不编造） */
  value: number | null;
}

interface CompassRadarProps {
  data: CompassDatum[];
  size?: number;
  /** 线条颜色（CSS color 值） */
  stroke?: string;
  /** 填充颜色 */
  fill?: string;
  className?: string;
}

export default function CompassRadar({
  data,
  size = 120,
  stroke = '#1D3557',
  fill = 'rgba(29, 53, 87, 0.08)',
  className,
}: CompassRadarProps) {
  const { t } = useI18n();
  const n = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14; // 留出标签空间
  // 标签可能比绘图区更宽（英文 Social/Climate 等），viewBox 向外扩边距避免裁切；
  // SVG 占位仍保持 size×size（缩放显示），不影响卡片布局。
  const padX = Math.round(size * 0.22);
  const padY = Math.round(size * 0.09);
  const vbW = size + padX * 2;
  const vbH = size + padY * 2;
  const angleStep = (Math.PI * 2) / n;
  // 顶部起始，顺时针
  const angleAt = (i: number): number => -Math.PI / 2 + i * angleStep;
  const pt = (i: number, v: number): [number, number] => {
    const rad = (r * v) / 100;
    return [cx + rad * Math.cos(angleAt(i)), cy + rad * Math.sin(angleAt(i))];
  };

  const known = data.map((d) => (d.value != null ? Math.max(0, Math.min(100, d.value)) : 0));
  const polyPoints = known.map((v, i) => pt(i, v).join(',')).join(' ');

  return (
    <svg
      viewBox={`${-padX} ${-padY} ${vbW} ${vbH}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={t('atlas.radar.aria')}
    >
      {/* 网格：3 层同心多边形 + 轴线，全部细线 */}
      {[1 / 3, 2 / 3, 1].map((f) => (
        <polygon
          key={f}
          points={data.map((_, i) => pt(i, f * 100).join(',')).join(' ')}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 100);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="1" />
        );
      })}

      {/* 数据多边形 */}
      <polygon points={polyPoints} fill={fill} stroke={stroke} strokeWidth="1.25" />

      {/* 数据点：缺失维画空心小环，有值画实心点 */}
      {data.map((d, i) => {
        const [x, y] = pt(i, known[i]);
        return d.value == null ? (
          <circle key={i} cx={x} cy={y} r="2" fill="#F9F8F6" stroke="#C9CDD2" strokeWidth="1" />
        ) : (
          <circle key={i} cx={x} cy={y} r="2.2" fill={stroke} />
        );
      })}

      {/* 维度标签 */}
      {data.map((d, i) => {
        const [x, y] = pt(i, 122);
        const anchor = Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end';
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={size >= 150 ? 9.5 : 8.5}
            fill={d.value == null ? '#9CA3AF' : '#525866'}
            fontFamily="'Noto Sans SC Variable', system-ui, sans-serif"
          >
            {d.value == null ? `${t(d.label)} —` : t(d.label)}
          </text>
        );
      })}
    </svg>
  );
}

/** 从 City + Country 派生六维数据（0-100；缺失为 null）。与引擎「降权不惩罚」同哲学：不编造。 */
export function buildCompassData(
  city: {
    monthlyCostUSD: number | null;
    livingScore: number | null;
    climateIndex: number | null;
    tags: string[];
    community: number | null;
    englishScore: number | null;
    internetMbps: number | null;
    safety: number | null;
    visaScore: number | null;
    countryCode: string | null;
  },
  country: {
    taxTopRatePct: number | null;
    visaPassport: { digitalNomad: string } | null;
  } | null,
): CompassDatum[] {
  // 生活成本：月成本低 → 高分（$800 满分线性至 $3500 零分）
  const cost = city.monthlyCostUSD != null ? Math.round(Math.max(0, Math.min(100, ((3500 - city.monthlyCostUSD) / (3500 - 800)) * 100))) : null;
  // 税优：最高边际税率低 → 高分（0% 满分 → 55% 零分）
  const tax = country?.taxTopRatePct != null ? Math.round(Math.max(0, Math.min(100, ((55 - country.taxTopRatePct) / 55) * 100))) : null;
  // 网速基建：Mbps 对数感映射（10→25, 30→50, 100→80, 250→95）
  const mbps = city.internetMbps;
  const net = mbps != null ? Math.round(Math.max(0, Math.min(100, 25 + 17 * Math.log10(mbps)))) : null;
  // 社群活力：community 指标优先，否则用 tags 数量代理（3→40, 6→85），英文能力加成
  const community = city.community ?? (city.tags.length > 0 ? Math.min(90, 25 + city.tags.length * 10 + (city.englishScore != null ? 8 : 0)) : null);
  // 气候：climateIndex（0-100 已归一）
  const climate = city.climateIndex ?? null;
  // 签证门槛：visaScore 优先；否则护照 digitalNomad=friendly → 85，unknown → null
  const visa = city.visaScore ?? (country?.visaPassport ? (country.visaPassport.digitalNomad === 'friendly' ? 85 : null) : null);

  return [
    { label: 'atlas.radar.cost', value: cost },
    { label: 'atlas.radar.tax', value: tax },
    { label: 'atlas.radar.speed', value: net },
    { label: 'atlas.radar.community', value: community },
    { label: 'atlas.radar.climate', value: climate },
    { label: 'atlas.radar.visa', value: visa },
  ];
}
