/**
 * 城市实景照片（自由许可，本地打包，不热链）。
 * 来源：Wikimedia Commons，逐图登记许可与作者（见 public/city-images/credits.json）。
 * 容错：无照片或加载失败时，回落到程序化「生活剪影」SVG，保证画面不空白。
 */
import { useState } from 'react';
import credits from '../../../public/city-images/credits.json';

interface Credit {
  file: string;
  artist: string;
  license: string;
  licenseUrl: string;
  source: string;
  sourceUrl: string;
}

const CREDITS = credits as Record<string, Credit>;

export function hasPhoto(cityId: string): boolean {
  return CREDITS[cityId] != null;
}

/** 程序化「生活剪影」：实时生成，无版权，作为无照片时的兜底 */
export function CityScape({ cityId, hue }: { cityId: string; hue: string }) {
  let seed = 0;
  for (let i = 0; i < cityId.length; i++) seed = (seed * 31 + cityId.charCodeAt(i)) % 997;
  const rand = (n: number): number => ((seed * (n * 7 + 13)) % 89) / 89;
  const buildings = Array.from({ length: 9 }, (_, i) => {
    const h = 18 + rand(i + 1) * 52;
    const w = 14 + rand(i + 9) * 26;
    const x = 8 + i * 52 + rand(i + 3) * 18;
    return { x, w, h };
  });
  const sunX = 40 + rand(5) * 220;

  return (
    <svg viewBox="0 0 400 130" className="h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <rect width="400" height="130" fill="#F1EFEA" />
      {[26, 52, 78, 104].map((y) => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#E5E7EB" strokeWidth="1" />
      ))}
      {[50, 120, 190, 260, 330].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="130" stroke="#E5E7EB" strokeWidth="1" opacity="0.6" />
      ))}
      <circle cx={sunX} cy={34 + rand(7) * 20} r="13" fill="none" stroke={hue} strokeWidth="1" opacity="0.75" />
      {buildings.map((b, i) => (
        <rect key={i} x={b.x} y={130 - b.h} width={b.w} height={b.h} fill={hue} opacity={0.14 + rand(i + 20) * 0.12} />
      ))}
      <line x1="0" y1="129.5" x2="400" y2="129.5" stroke={hue} strokeWidth="1.4" />
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={20 + i * 58 + rand(i + 30) * 20} cy={112 + rand(i + 40) * 10} r="1.2" fill={hue} opacity="0.5" />
      ))}
    </svg>
  );
}

export default function CityPhoto({
  cityId,
  hue,
  className,
}: {
  cityId: string;
  hue: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const credit = CREDITS[cityId];
  if (!credit || failed) {
    return <CityScape cityId={cityId} hue={hue} />;
  }
  return (
    <img
      src={credit.file}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className ?? 'h-full w-full object-cover'}
    />
  );
}

/** 图片署名（合规展示）：作者 · 许可（可点击到 Commons 原图页） */
export function PhotoCredit({ cityId }: { cityId: string }) {
  const credit = CREDITS[cityId];
  if (!credit) return null;
  return (
    <a
      href={credit.sourceUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="pointer-events-auto inline-flex items-center gap-1 rounded-[4px] bg-ink/55 px-1.5 py-0.5 font-data text-[8.5px] leading-tight text-white/90 backdrop-blur-[2px] transition-colors hover:bg-ink/70"
      title={`${credit.source} · ${credit.license}`}
    >
      <span className="max-w-[150px] truncate">{credit.artist || credit.source}</span>
      <span className="text-white/60">·</span>
      <span>{credit.license}</span>
    </a>
  );
}
