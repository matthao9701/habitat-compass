/**
 * 画册式城市卡片 + 右侧速览抽屉（编辑部风改版核心交互）。
 * 卡片：城市实景照片（自由许可，兜底程序化剪影）+ 右上角数据胶囊 + 衬线城市名 + 六维罗盘雷达。
 * 抽屉：右侧滑出，上半城市实景与氛围，下半紧凑数据表（税阶/签证/合规注意点）。
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CompassRadar, { buildCompassData } from './CompassRadar';
import CityPhoto, { PhotoCredit } from './CityPhoto';
import { getCountry } from '../../data/countries';
import { cityName, countryName, climateSummary, tagLabel, englishBandLabel, entryNote, formatMoneyShort } from '../../lib/format';
import { overlapHours } from '../../lib/timezone';
import { useI18n } from '../../i18n';
import type { City } from '../../data/types';

/** 数据胶囊标签（右上角浮动） */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[5px] border border-line bg-white/92 px-2 py-0.5 font-data text-[10.5px] leading-tight text-ink shadow-[0_1px_2px_rgba(31,36,33,0.05)] backdrop-blur-[2px]">
      {children}
    </span>
  );
}

/** 签证彩色胶囊（数据忠实：入境便利 / 长期居留难度；数字游民签门槛低为独立正面信号） */
type VisaTone = 'easy' | 'mid' | 'dn' | 'hard';

function VisaPill({ tone, children }: { tone: VisaTone; children: React.ReactNode }) {
  const style: Record<VisaTone, string> = {
    easy: 'border-moss/45 bg-moss/10 text-moss',
    mid: 'border-line bg-white/92 text-ink',
    dn: 'border-sea/45 bg-sea/10 text-sea',
    hard: 'border-clay/45 bg-clay/10 text-clay-deep',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-[5px] border px-2 py-0.5 font-data text-[10.5px] font-medium leading-tight backdrop-blur-[2px] ${style[tone]}`}>
      {children}
    </span>
  );
}

export interface AtlasCardProps {
  city: City;
  index: number;
  onOpen: (city: City) => void;
  formatMoney: (usd: number) => string;
  /** 空状态「最接近」提示角标（可选） */
  badge?: string;
}

export function AtlasCard({ city, index, onOpen, formatMoney, badge }: AtlasCardProps) {
  const { t } = useI18n();
  const country = getCountry(city.countryCode);
  const compass = buildCompassData(
    { ...city, internetMbps: city.internetMbps ?? country?.internetMbpsFixed ?? null },
    country,
  );
  const climate = climateSummary(city.climateDetail, undefined);
  const beijing = overlapHours(city.timezone, 'beijing');
  const london = overlapHours(city.timezone, 'london');
  const visaEntry = country?.visaPassport?.entry ?? null;
  const dnFriendly = country?.visaPassport?.digitalNomad ?? null;
  const longTermRestricted = country?.visaPassport?.longTerm === 'restricted';
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
      {/* 城市实景 + 数据胶囊 */}
      <div className="relative h-[150px] overflow-hidden border-b border-line">
        <CityPhoto cityId={city.id} hue="#1D3557" className="h-full w-full object-cover transition-transform duration-500 ease-chart group-hover:scale-[1.03]" />
        {/* 顶部渐隐，保证胶囊可读 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ink/25 to-transparent" />
        <div className="absolute right-2.5 top-2.5 flex max-w-[75%] flex-wrap justify-end gap-1.5">
          {(visaEntry === 'visaFree' || visaEntry === 'visaOnArrival') && <VisaPill tone="easy">{t('atlas.visa.difficultyEasy')}</VisaPill>}
          {visaEntry === 'eVisa' && <VisaPill tone="mid">{t('atlas.visa.difficultyEVisa')}</VisaPill>}
          {visaEntry === 'visaRequired' && <VisaPill tone="hard">{t('atlas.visa.difficultyAdvance')}</VisaPill>}
          {longTermRestricted && <VisaPill tone="hard">{t('atlas.visa.difficultyLongHard')}</VisaPill>}
          {dnFriendly === 'friendly' && (
            <VisaPill tone="dn">{t('atlas.visa.difficultyDnEasy')}</VisaPill>
          )}
          {city.monthlyCostUSD != null && <Pill>{formatMoney(city.monthlyCostUSD)}{t('atlas.card.perMonth')}</Pill>}
        </div>
        {/* 空状态「最接近」角标（仅筛选无果时的兜底推荐显示） */}
        {badge && (
          <span className="absolute left-3 top-2.5 rounded-[4px] bg-clay/85 px-1.5 py-0.5 font-data text-[10px] tracking-[0.14em] text-paper backdrop-blur-[2px]">
            {badge}
          </span>
        )}
        {/* 期号式角标 */}
        <span className="absolute left-3 bottom-2.5 rounded-[4px] bg-ink/45 px-1 py-0.5 font-data text-[10px] tracking-[0.18em] text-white/85 backdrop-blur-[2px]">
          Nº {String(index + 1).padStart(3, '0')}
        </span>
        {/* 图片署名（合规） */}
        <div className="absolute bottom-1.5 right-2.5">
          <PhotoCredit cityId={city.id} />
        </div>
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
          {countryName(country)} · {climate ?? t('atlas.card.climatePending')}
        </p>

        {/* 人话信息行：时区重叠 + 成本拆解 */}
        <div className="mt-2.5 space-y-1 font-data text-[10.5px] text-ink-soft">
          {(beijing != null || london != null) && (
            <p>
              {beijing != null && london != null && beijing !== london
                ? t('atlas.tz.overlapBoth', { london, beijing })
                : beijing != null
                  ? beijing === 0
                    ? t('atlas.tz.overlapNone')
                    : t('atlas.tz.overlapBeijing', { h: beijing })
                  : t('atlas.tz.overlapLondon', { h: london as number })}
            </p>
          )}
          {city.housingLevel != null && (
            <p>
              {t('atlas.cost.shareRoom')} {formatMoneyShort(city.housingLevel * 0.45)} · {t('atlas.cost.soloApt')} {formatMoneyShort(city.housingLevel)}
            </p>
          )}
        </div>

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
  const climate = city ? climateSummary(city.climateDetail, undefined) : null;
  const beijing = city ? overlapHours(city.timezone, 'beijing') : null;
  const london = city ? overlapHours(city.timezone, 'london') : null;
  const overlapText = beijing == null && london == null
    ? null
    : beijing != null && london != null && beijing !== london
      ? t('atlas.tz.overlapBoth', { london, beijing })
      : beijing != null
        ? t('atlas.tz.overlapBeijing', { h: beijing })
        : t('atlas.tz.overlapLondon', { h: london as number });

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
            {/* 顶部：城市实景 + 标题 */}
            <div className="relative h-[220px] shrink-0 overflow-hidden border-b border-line">
              <CityPhoto cityId={city.id} hue="#1D3557" className="h-full w-full object-cover" />
              {/* 底部渐隐，标题可读 */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[6px] border border-line bg-white/90 font-data text-sm text-ink transition-colors hover:bg-white"
                aria-label={t('atlas.drawer.close')}
              >
                ✕
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="font-data text-[10px] uppercase tracking-[0.2em] text-white/75">
                  field notes · {city.nameEn}
                </p>
                <h3 className="font-display text-[30px] font-semibold leading-tight text-white">
                  {cityName(city)}
                  <span className="ml-2.5 align-middle font-data text-[11px] font-normal tracking-[0.12em] text-white/80">
                    {countryName(country)}
                  </span>
                </h3>
              </div>
              <div className="absolute right-3 bottom-3">
                <PhotoCredit cityId={city.id} />
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
                    {climate
                      ? t('atlas.drawer.climateLine', {
                          summary: climate,
                          sun: city.climateDetail!.sunshineHours,
                          precip: city.climateDetail!.annualPrecipMm,
                        })
                      : t('atlas.drawer.climatePending')}
                    {city.airQuality
                      ? ' ' + t('atlas.drawer.airLine', {
                          band: t(`air.band.${city.airQuality.band}`),
                          pm25: city.airQuality.pm25,
                        })
                      : ''}
                    {city.tags.length > 0
                      ? ' ' + t('atlas.drawer.tagsLine', { tags: city.tags.slice(0, 4).map((g) => tagLabel(g)).join(' / ') })
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
                    {city.housingLevel != null && (
                      <Row
                        label={t('atlas.drawer.row.housing')}
                        value={t('atlas.drawer.row.housingVal', {
                          shareRoom: t('atlas.cost.shareRoom'),
                          share: formatMoney(Math.round(city.housingLevel * 0.45)),
                          soloApt: t('atlas.cost.soloApt'),
                          solo: formatMoney(city.housingLevel),
                        })}
                      />
                    )}
                    {overlapText != null && (
                      <Row label={t('atlas.drawer.row.timezone')} value={t('atlas.drawer.row.timezoneVal', { overlap: overlapText, tz: city.timezone ?? '—' })} />
                    )}
                    <Row
                      label={t('atlas.drawer.row.entry')}
                      value={country?.visaPassport ? t('atlas.drawer.row.entryVal', { label: t(VISA_LABEL_KEYS[country.visaPassport.entry]), note: entryNote(country.visaPassport.entryNote) }) : t('profile.visa.pending')}
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
                    <Row label={t('atlas.drawer.row.english')} value={englishBandLabel(city.englishBand)} />
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
