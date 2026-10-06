/**
 * 画册式城市卡片 + 右侧速览抽屉（编辑部风改版核心交互）。
 * 卡片：生活剪影（程序化 SVG 地平线/海平线）+ 右上角数据胶囊 + 衬线城市名 + 六维罗盘雷达。
 * 抽屉：右侧滑出，上半城市实景与氛围，下半紧凑数据表（税阶/签证/合规注意点）。
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CompassRadar, { buildCompassData } from './CompassRadar';
import { getCountry } from '../../data/countries';
import { cityName, countryName } from '../../lib/format';
import { useI18n } from '../../i18n';
import type { City } from '../../data/types';

/** 程序化「生活剪影」：按城市 id 生成确定性的地平线 + 日轮 + 经纬网格 */
function CityScape({ cityId, hue }: { cityId: string; hue: string }) {
  // 确定性伪随机（同 id 同图，避免每次渲染跳动）
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
      {/* 纸底天空 */}
      <rect width="400" height="130" fill="#F1EFEA" />
      {/* 细线经纬网格 */}
      {[26, 52, 78, 104].map((y) => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#E5E7EB" strokeWidth="1" />
      ))}
      {[50, 120, 190, 260, 330].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="130" stroke="#E5E7EB" strokeWidth="1" opacity="0.6" />
      ))}
      {/* 日轮 */}
      <circle cx={sunX} cy={34 + rand(7) * 20} r="13" fill="none" stroke={hue} strokeWidth="1" opacity="0.75" />
      {/* 地平线剪影 */}
      {buildings.map((b, i) => (
        <rect key={i} x={b.x} y={130 - b.h} width={b.w} height={b.h} fill={hue} opacity={0.14 + rand(i + 20) * 0.12} />
      ))}
      {/* 海平线 */}
      <line x1="0" y1="129.5" x2="400" y2="129.5" stroke={hue} strokeWidth="1.4" />
      {/* 等高线小点 */}
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={20 + i * 58 + rand(i + 30) * 20} cy={112 + rand(i + 40) * 10} r="1.2" fill={hue} opacity="0.5" />
      ))}
    </svg>
  );
}

/** 数据胶囊标签（右上角浮动） */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[5px] border border-line bg-white/92 px-2 py-0.5 font-data text-[10.5px] leading-tight text-ink shadow-[0_1px_2px_rgba(31,36,33,0.05)] backdrop-blur-[2px]">
      {children}
    </span>
  );
}

export interface AtlasCardProps {
  city: City;
  index: number;
  onOpen: (city: City) => void;
  formatMoney: (usd: number) => string;
}

export function AtlasCard({ city, index, onOpen, formatMoney }: AtlasCardProps) {
  const { t } = useI18n();
  const country = getCountry(city.countryCode);
  const compass = buildCompassData(
    { ...city, internetMbps: city.internetMbps ?? country?.internetMbpsFixed ?? null },
    country,
  );
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onOpen(city)}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-card text-left transition-all duration-300 ease-chart hover:border-ink/25 hover:shadow-[0_10px_32px_rgba(31,36,33,0.07)]"
    >
      {/* 生活剪影 + 数据胶囊 */}
      <div className="relative h-[130px] overflow-hidden border-b border-line">
        <CityScape cityId={city.id} hue="#1D3557" />
        <div className="absolute right-2.5 top-2.5 flex max-w-[75%] flex-wrap justify-end gap-1.5">
          {city.monthlyCostUSD != null && <Pill>{formatMoney(city.monthlyCostUSD)}{t('atlas.card.perMonth')}</Pill>}
          {city.climateDetail && <Pill>{Math.round(city.climateDetail.avgTempC)}°C</Pill>}
          {country?.visaPassport?.entry === 'visaFree' && <Pill>{t('atlas.card.visaFree')}</Pill>}
          {country?.visaPassport?.entry === 'visaOnArrival' && <Pill>{t('atlas.card.visaOnArrival')}</Pill>}
          {country?.visaPassport?.entry === 'eVisa' && <Pill>{t('atlas.card.eVisa')}</Pill>}
        </div>
        {/* 期号式角标 */}
        <span className="absolute left-3 top-2.5 font-data text-[10px] tracking-[0.18em] text-ink/45">
          Nº {String(index + 1).padStart(3, '0')}
        </span>
      </div>

      {/* 内容区 */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-[19px] font-semibold tracking-wide text-ink transition-colors group-hover:text-pine">
            {cityName(city)}
          </h3>
          <span className="shrink-0 font-data text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            {city.nameEn}
          </span>
        </div>
        <p className="mt-0.5 font-data text-[10.5px] text-ink-soft">
          {countryName(country)} · {city.climateDetail?.summary ?? t('atlas.card.climatePending')}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
          <CompassRadar data={compass} size={116} />
          <div className="flex flex-col items-end gap-1.5 text-right">
            <span className="font-data text-[10px] leading-tight text-ink-soft">
              {city.safety != null ? t('atlas.card.safety', { v: city.safety }) : t('atlas.card.safetyNA')}
            </span>
            <span className="font-data text-[10px] leading-tight text-ink-soft">
              {country?.taxTopRatePct != null ? t('atlas.card.tax', { v: country.taxTopRatePct }) : t('atlas.card.taxNA')}
            </span>
            <span className="font-data text-[10px] leading-tight text-ink-soft">
              {(city.internetMbps ?? country?.internetMbpsFixed) != null
                ? `${city.internetMbps ?? country?.internetMbpsFixed} Mbps`
                : t('atlas.card.netNA')}
            </span>
            <span className="mt-1 font-data text-[9.5px] uppercase tracking-[0.16em] text-clay opacity-0 transition-opacity group-hover:opacity-100">
              {t('atlas.card.expand')}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/** 右侧速览抽屉 */
interface DrawerProps {
  city: City | null;
  onClose: () => void;
  formatMoney: (usd: number) => string;
}

const VISA_LABEL_KEYS: Record<string, string> = {
  visaFree: 'atlas.visa.visaFree',
  visaOnArrival: 'atlas.visa.visaOnArrival',
  eVisa: 'atlas.visa.eVisa',
  visaRequired: 'atlas.visa.visaRequired',
};

const DN_LABEL_KEYS: Record<string, string> = {
  friendly: 'atlas.dn.friendly',
  restricted: 'atlas.dn.restricted',
  unknown: 'profile.visa.pending',
};

export function CityDrawer({ city, onClose, formatMoney }: DrawerProps) {
  const { t } = useI18n();
  // Esc 关闭 + 打开时锁滚动
  useEffect(() => {
    if (!city) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [city, onClose]);

  const country = city ? getCountry(city.countryCode) : null;
  const netMbps = city ? city.internetMbps ?? country?.internetMbpsFixed ?? null : null;
  const compass = city
    ? buildCompassData({ ...city, internetMbps: city.internetMbps ?? country?.internetMbpsFixed ?? null }, country)
    : [];

  return (
    <AnimatePresence>
      {city && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/25"
          />
          {/* 抽屉 */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-line bg-paper shadow-[-12px_0_40px_rgba(31,36,33,0.10)]"
            role="dialog"
            aria-modal="true"
            aria-label={t('atlas.drawer.aria', { name: cityName(city) })}
          >
            {/* 顶部：实景剪影 + 标题 */}
            <div className="relative h-[200px] shrink-0 overflow-hidden border-b border-line">
              <CityScape cityId={city.id} hue="#1D3557" />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[6px] border border-line bg-white/90 font-data text-sm text-ink transition-colors hover:bg-white"
                aria-label={t('atlas.drawer.close')}
              >
                ✕
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="font-data text-[10px] uppercase tracking-[0.2em] text-ink/55">
                  field notes · {city.nameEn}
                </p>
                <h3 className="font-display text-[30px] font-semibold leading-tight text-ink">
                  {cityName(city)}
                  <span className="ml-2.5 align-middle font-data text-[11px] font-normal tracking-[0.12em] text-ink-soft">
                    {countryName(country)}
                  </span>
                </h3>
              </div>
            </div>

            {/* 可滚动内容 */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {/* 氛围行 */}
              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[6px] border border-line bg-line text-center">
                {[
                  [city.monthlyCostUSD != null ? `${formatMoney(city.monthlyCostUSD)}` : '—', t('atlas.drawer.monthCost')],
                  [city.climateDetail ? `${Math.round(city.climateDetail.avgTempC)}°C` : '—', t('atlas.drawer.avgTemp')],
                  [(city.internetMbps ?? country?.internetMbpsFixed)?.toString() ?? '—', 'Mbps'],
                ].map(([v, l]) => (
                  <div key={l} className="bg-white px-2 py-3">
                    <p className="font-data text-[15px] font-medium text-ink">{v}</p>
                    <p className="mt-0.5 font-data text-[9px] uppercase tracking-[0.16em] text-ink-soft">{l}</p>
                  </div>
                ))}
              </div>

              {/* 罗盘雷达 + 剪影说明 */}
              <div className="mt-5 flex items-start gap-4">
                <CompassRadar data={compass} size={168} />
                <div className="flex-1 pt-1">
                  <p className="eyebrow mb-2">{t('atlas.drawer.ambience')}</p>
                  <p className="text-[12.5px] leading-[1.8] text-ink-soft">
                    {city.climateDetail
                      ? t('atlas.drawer.climateLine', {
                          summary: city.climateDetail.summary,
                          sun: city.climateDetail.sunshineHours,
                          precip: city.climateDetail.annualPrecipMm,
                        })
                      : t('atlas.drawer.climatePending')}
                    {city.airQuality
                      ? t('atlas.drawer.airLine', {
                          band: t(`air.band.${city.airQuality.band}`),
                          pm25: city.airQuality.pm25,
                        })
                      : ''}
                    {city.tags.length > 0
                      ? t('atlas.drawer.tagsLine', { tags: city.tags.slice(0, 4).join(' / ') })
                      : ''}
                  </p>
                </div>
              </div>

              {/* 数据表 */}
              <div className="mt-5 overflow-hidden rounded-[6px] border border-line">
                <p className="border-b border-line bg-paper-deep px-4 py-2 font-data text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                  {t('atlas.drawer.dataSheet')}
                </p>
                <table className="w-full text-left text-[12px]">
                  <tbody className="divide-y divide-line">
                    <Row label={t('atlas.drawer.row.monthlyCost')} value={city.monthlyCostUSD != null ? t('atlas.drawer.row.monthlyCostVal', { money: formatMoney(city.monthlyCostUSD) }) : t('profile.visa.pending')} />
                    <Row label={t('atlas.drawer.row.living')} value={city.livingScore != null ? t('atlas.drawer.row.livingVal', { v: city.livingScore }) : t('profile.visa.pending')} />
                    <Row label={t('atlas.drawer.row.taxTop')} value={country?.taxTopRatePct != null ? t('atlas.drawer.row.taxTopVal', { v: country.taxTopRatePct }) : t('profile.visa.pending')} />
                    <Row label={t('atlas.drawer.row.internet')} value={netMbps != null ? t('atlas.drawer.row.internetVal', { v: netMbps }) : t('profile.visa.pending')} />
                    <Row
                      label={t('atlas.drawer.row.entry')}
                      value={country?.visaPassport ? t('atlas.drawer.row.entryVal', { label: t(VISA_LABEL_KEYS[country.visaPassport.entry]), note: country.visaPassport.entryNote }) : t('profile.visa.pending')}
                    />
                    <Row
                      label={t('atlas.drawer.row.dnVisa')}
                      value={country?.visaPassport ? t(DN_LABEL_KEYS[country.visaPassport.digitalNomad]) : t('profile.visa.pending')}
                    />
                    <Row
                      label={t('atlas.drawer.row.taxResidency')}
                      value={country?.longStay?.taxResidencyDays != null ? t('atlas.drawer.row.taxResidencyVal', { days: country.longStay.taxResidencyDays }) : t('profile.visa.pending')}
                    />
                    <Row label={t('atlas.drawer.row.safety')} value={city.safety != null ? t('atlas.drawer.row.safetyVal', { v: city.safety }) : t('profile.visa.pending')} />
                    <Row label={t('atlas.drawer.row.english')} value={city.englishBand ?? t('profile.visa.pending')} />
                  </tbody>
                </table>
              </div>

              {/* 合规注意点 */}
              <div className="mt-4 rounded-[6px] border border-line bg-white p-4">
                <p className="eyebrow mb-2">{t('atlas.drawer.compliance')}</p>
                <ul className="list-disc space-y-1.5 pl-4 text-[12px] leading-[1.75] text-ink-soft">
                  <li>{t('atlas.drawer.comp1', { date: country?.visaPassport?.snapshotDate ?? '—' })}</li>
                  <li>{t('atlas.drawer.comp2')}</li>
                  {country?.longStay?.socialSecurityCn != null && country.longStay.socialSecurityCn !== 'none' && (
                    <li>{t('atlas.drawer.comp3', { status: country.longStay.socialSecurityCn === 'treaty' ? t('atlas.drawer.ssActive') : t('atlas.drawer.ssNegotiating') })}</li>
                  )}
                </ul>
              </div>

              <p className="mt-3 text-center font-data text-[9.5px] uppercase tracking-[0.16em] text-ink-soft/70">
                habitat compass · open data almanac
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="bg-white">
      <td className="px-4 py-2 text-ink-soft">{label}</td>
      <td className="px-4 py-2 text-right font-data text-[11.5px] text-ink">{value}</td>
    </tr>
  );
}
