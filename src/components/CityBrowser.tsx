// ABOUTME: 城市库 Tab——独立浏览 200 城的图集页（大洲筛选 + 轻量过滤 + 速览抽屉）。
// 与 Landing 的图集区块共用 AtlasCard / CityDrawer / SentenceFilter，但独立承载「纯浏览」心智，
// 让首屏专注意向，同时把「按图索骥」拆成常驻入口。
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AtlasCard, CityDrawer } from './atlas/AtlasCard';
import SentenceFilter, { DEFAULT_FILTER, filterCities, type FilterState } from './atlas/SentenceFilter';
import { cities } from '../data';
import { REGION_ORDER } from '../data/regions';
import { formatMoney } from '../lib/format';
import type { City } from '../data/types';
import { useI18n } from '../i18n';

export default function CityBrowser() {
  const { t } = useI18n();
  const [region, setRegion] = useState<string>('all');
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [drawerCity, setDrawerCity] = useState<City | null>(null);
  const filtered = filterCities(cities, filter);
  const shown = region === 'all' ? filtered : filtered.filter((c) => c.region === region);

  return (
    <div className="grain min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-almanac px-5 py-8 md:px-10 md:py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="eyebrow mb-4">{t('cities.eyebrow')}</p>
          <h1 className="max-w-3xl font-display text-[28px] font-medium leading-[1.2] tracking-tight sm:text-[34px] md:text-[46px]">
            {t('cities.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-[1.9] text-ink-soft">{t('cities.lead')}</p>
        </motion.div>

        <div className="mt-8">
          <SentenceFilter
            value={filter}
            onChange={setFilter}
            matchedCount={filtered.length}
            totalCount={cities.length}
          />
        </div>

        {/* 大洲筛选 */}
        <div className="mb-7 mt-7 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRegion('all')}
            className={`inline-flex min-h-[44px] items-center rounded-[5px] border px-4 py-2.5 font-data text-[11px] transition-colors ${
              region === 'all' ? 'border-pine bg-pine text-paper' : 'border-line bg-card text-ink-soft hover:border-pine/50'
            }`}
          >
            {t('landing.atlas.all')} · {filtered.length}
          </button>
          {REGION_ORDER.map((r) => {
            const count = filtered.filter((c) => c.region === r).length;
            if (count === 0) return null;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`inline-flex min-h-[44px] items-center rounded-[5px] border px-4 py-2.5 font-data text-[11px] transition-colors ${
                  region === r ? 'border-pine bg-pine text-paper' : 'border-line bg-card text-ink-soft hover:border-pine/50'
                }`}
              >
                {t(`region.${r}`)} · {count}
              </button>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-card px-6 py-10 text-center">
            <p className="font-display text-xl text-ink">{t('landing.atlas.emptyTitle')}</p>
            <p className="mt-2 text-sm text-ink-soft">{t('landing.atlas.emptyHint')}</p>
            <button
              type="button"
              onClick={() => {
                setFilter(DEFAULT_FILTER);
                setRegion('all');
              }}
              className="mt-5 inline-flex min-h-[44px] items-center rounded-full border border-pine px-5 py-2.5 font-data text-[11px] uppercase tracking-[0.14em] text-pine transition-colors hover:bg-pine hover:text-paper"
            >
              {t('landing.atlas.resetFilter')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((c, i) => (
                <AtlasCard key={c.id} city={c} index={i} onOpen={setDrawerCity} formatMoney={(usd) => formatMoney(usd)} />
              ))}
            </div>
            <p className="mt-5 font-data text-[10px] text-ink-soft">{t('landing.atlas.footnote')}</p>
          </>
        )}
      </div>

      <CityDrawer city={drawerCity} onClose={() => setDrawerCity(null)} formatMoney={formatMoney} />
    </div>
  );
}
