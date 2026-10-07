// 城市对比页：选城 → 临时权重重算 → 多维对比 → 备注/存档
// 重算只作用于本页展示，不回写引擎与报告。
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import CompassMark from '../CompassMark';
import { PREFERENCE_DIMENSIONS } from '../../lib/analysis';
import {
  COMPARE_CITY_LIMIT,
  COMPARE_COLORS,
  NEUTRAL_ANSWERS,
  buildCompareRow,
  defaultWeights,
  equalWeights,
  isDefaultWeights,
  rankRows,
  weightShare,
  type CompareRow,
} from '../../lib/compare';
import { type AssessmentResult, type UserAnswers } from '../../lib/engine';
import * as storage from '../../lib/storage';
import { cities } from '../../data';
import { REGION_ORDER } from '../../data/regions';
import CompareCharts from './CompareCharts';
import CompareDataCards from './CompareDataCards';
import { useI18n } from '../../i18n';
import { cityName, cityCountryName, dimensionLabel, subregionName } from '../../lib/format';

const ease = [0.22, 1, 0.36, 1] as const;

/** 收藏星标（纯几何四角星，无 emoji） */
function FavButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={active ? t('cmp.fav.remove') : t('profile.favorites')}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] transition-colors ${
        active ? 'text-clay' : 'text-ink-soft hover:text-clay'
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M10 1.5 L12.1 7.9 L18.5 10 L12.1 12.1 L10 18.5 L7.9 12.1 L1.5 10 L7.9 7.9 Z"
          fill={active ? '#EE6C4D' : 'none'}
          stroke={active ? '#EE6C4D' : '#4E7A96'}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

interface CompareScreenProps {
  result: AssessmentResult | null;
  answers: UserAnswers | null;
  seedCities: string[];
  onOpenQuiz: () => void;
}

export default function CompareScreen({ result, answers, seedCities, onOpenQuiz }: CompareScreenProps) {
  const { t } = useI18n();
  const cityById = useMemo(() => new Map(cities.map((c) => [c.id, c])), []);
  const validId = (id: string): boolean => cityById.has(id);

  const [selected, setSelected] = useState<string[]>(() => {
    const seed = seedCities.filter(validId);
    if (seed.length > 0) return seed.slice(0, COMPARE_CITY_LIMIT);
    const saved = storage.loadCompareState();
    return (saved?.selected ?? []).filter(validId).slice(0, COMPARE_CITY_LIMIT);
  });
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const saved = storage.loadCompareState();
    if (saved?.weights) return saved.weights;
    return answers ? defaultWeights() : equalWeights();
  });
  const [cityNotes, setCityNotes] = useState<Record<string, string>>(() => storage.loadCompareState()?.cityNotes ?? {});
  const [overallNote, setOverallNote] = useState<string>(() => storage.loadCompareState()?.overallNote ?? '');
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [subFilter, setSubFilter] = useState<string>('all');
  const [pendingCity, setPendingCity] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [favIds, setFavIds] = useState<string[]>(() => storage.loadFavorites());

  function toggleFav(id: string): void {
    const next = favIds.includes(id) ? favIds.filter((x) => x !== id) : [...favIds, id];
    setFavIds(next);
    storage.saveFavorites(next);
  }

  const personalized = answers != null && result != null;
  const effectiveAnswers: UserAnswers = answers ?? NEUTRAL_ANSWERS;

  // ---- 持久化工作区状态 ----
  useEffect(() => {
    storage.saveCompareState({ selected, weights, cityNotes, overallNote });
  }, [selected, weights, cityNotes, overallNote]);

  useEffect(() => {
    if (!savedToast) return;
    const t = window.setTimeout(() => setSavedToast(false), 2400);
    return () => window.clearTimeout(t);
  }, [savedToast]);

  // ---- 重算（临时权重，仅本页） ----
  const rows: CompareRow[] = useMemo(
    () =>
      selected
        .filter((id) => cityById.has(id))
        .map((id, i) => {
          const city = cityById.get(id);
          if (!city) return null;
          return buildCompareRow(
            city,
            COMPARE_COLORS[i % COMPARE_COLORS.length],
            effectiveAnswers,
            weights,
          );
        })
        .filter((r): r is CompareRow => r != null),
    [selected, weights, effectiveAnswers, cityById],
  );
  const ranked = useMemo(() => rankRows(rows), [rows]);

  const queryLower = query.trim().toLowerCase();
  // 大洲 → 次区域级联；query 与筛选器任一生效即显示候选列表
  const subOptions = useMemo(() => {
    const pool =
      regionFilter === 'all' ? cities : cities.filter((c) => c.region === regionFilter);
    return [...new Set(pool.map((c) => c.subregion).filter((s): s is string => s != null))];
  }, [regionFilter]);

  const filtered = cities.filter(
    (c) =>
      (regionFilter === 'all' || c.region === regionFilter) &&
      (subFilter === 'all' || c.subregion === subFilter) &&
      (queryLower === '' ||
        cityName(c).includes(query.trim()) ||
        c.nameEn.toLowerCase().includes(queryLower) ||
        c.countryZh.includes(query.trim())),
  );
  const showCandidates = queryLower !== '' || regionFilter !== 'all' || subFilter !== 'all';

  // ---- 操作 ----
  function addCity(id: string): void {
    if (selected.includes(id)) return;
    if (selected.length < COMPARE_CITY_LIMIT) {
      setSelected((prev) => [...prev, id]);
      return;
    }
    setPendingCity(id); // 已满 → 弹窗选择替换
  }

  function removeCity(id: string): void {
    setSelected((prev) => prev.filter((x) => x !== id));
  }

  function replaceAt(index: number): void {
    if (!pendingCity) return;
    setSelected((prev) => prev.map((x, i) => (i === index ? pendingCity : x)));
    setPendingCity(null);
  }

  function resetWeights(): void {
    setWeights(personalized ? defaultWeights() : equalWeights());
  }

  function saveArchive(): void {
    if (selected.length === 0) return;
    storage.saveArchive({
      id: `cmp-${Date.now().toString(36)}`,
      savedAt: Date.now(),
      cities: selected,
      weights,
      composites: ranked.map((r) => ({ id: r.city.id, score: r.composite })),
      cityNotes,
      overallNote,
      personalized,
    });
    setSavedToast(true);
  }

  const pending = pendingCity ? cityById.get(pendingCity) : null;

  return (
    <div className="pb-20">
      {/* 页头 */}
      <section className="border-b hairline bg-paper-deep/50">
        <div className="mx-auto max-w-almanac px-6 py-10 md:px-10">
          <p className="eyebrow">{t('cmp.sec.select.eyebrow')}</p>
          <h1 className="mt-2 font-display text-[26px] font-bold tracking-tight md:text-[32px]">{t('cmp.sec.select.title')}</h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-[1.8] text-ink-soft">
            {t('cmp.note.limit', { limit: COMPARE_CITY_LIMIT })}
          </p>
          {!personalized && (
            <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-[8px] border border-ochre/40 bg-ochre/[0.07] px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-[12.5px] leading-[1.7] text-ink-soft">
                {t('cmp.note.neutral')}
              </p>
              <button
                type="button"
                onClick={onOpenQuiz}
                className="btn-ghost shrink-0 font-mono text-[11px]"
              >
                {t('cmp.note.quizCta')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 选城区 */}
      <section className="mx-auto max-w-almanac px-6 py-10 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* 搜索自选 */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[17px] font-bold">{t('cmp.search')}</h2>
              <span className="font-mono text-[10px] text-ink-soft">{t('cmp.selectedCount', { sel: selected.length, limit: COMPARE_CITY_LIMIT })}</span>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('cmp.search.placeholder')}
              className="mt-3 w-full rounded-[8px] border border-ink/15 bg-card px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-soft/60 outline-none transition-colors focus:border-clay"
            />
            {/* 大洲 / 次区域筛选 */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              <select
                value={regionFilter}
                onChange={(e) => {
                  setRegionFilter(e.target.value);
                  setSubFilter('all');
                }}
                aria-label={t('cmp.filter.regionAria')}
                className="rounded-[6px] border border-ink/15 bg-card px-2.5 py-1.5 font-mono text-[11px] text-ink outline-none focus:border-clay"
              >
                <option value="all">{t('cmp.filter.all', { count: cities.length })}</option>
                {REGION_ORDER.map((r) => (
                  <option key={r} value={r}>
                    {t(`region.${r}`)}
                  </option>
                ))}
              </select>
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                aria-label={t('cmp.filter.subAria')}
                className="rounded-[6px] border border-ink/15 bg-card px-2.5 py-1.5 font-mono text-[11px] text-ink outline-none focus:border-clay"
              >
                <option value="all">{t('cmp.filter.allSub')}</option>
                {subOptions.map((s) => (
                  <option key={s} value={s}>
                    {subregionName(s)}
                  </option>
                ))}
              </select>
            </div>
            {showCandidates && (
              <div className="mt-3 grid max-h-[280px] gap-1.5 overflow-y-auto pr-1">
                {filtered.length === 0 && (
                  <p className="px-1 py-3 font-mono text-[11px] text-ink-soft">{t('cmp.filter.empty')}</p>
                )}
                {filtered.map((c) => {
                  const added = selected.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center rounded-[7px] border transition-colors ${
                        added
                          ? 'border-ink/10 bg-ink/[0.04]'
                          : 'border-ink/12 bg-card hover:border-clay/50 hover:bg-clay/[0.04]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => addCity(c.id)}
                        disabled={added}
                        className="flex flex-1 items-center justify-between px-3.5 py-2 text-left"
                      >
                        <span className={`text-[12.5px] ${added ? 'text-ink-soft/60' : 'text-ink'}`}>
                          {cityName(c)}
                          <span className="ml-2 font-mono text-[10px] text-ink-soft">
                            {cityCountryName(c)} · {subregionName(c.subregion)}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] text-ink-soft">{added ? t('cmp.added') : t('cmp.add')}</span>
                      </button>
                      <FavButton
                        active={favIds.includes(c.id)}
                        onClick={() => toggleFav(c.id)}
                        label={favIds.includes(c.id) ? t('cmp.fav.remove', { name: cityName(c) }) : t('cmp.fav.add', { name: cityName(c) })}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* 已选 chips */}
            {selected.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {selected.map((id, i) => {
                  const c = cityById.get(id);
                  if (!c) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-2 rounded-full border border-ink/15 bg-card py-1 pl-2.5 pr-1.5 text-[12px] text-ink"
                    >
                      <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }} />
                      {cityName(c)}
                      <button
                        type="button"
                        onClick={() => removeCity(id)}
                        aria-label={t('cmp.removeCity', { name: cityName(c) })}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-clay/15 hover:text-clay"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* 推荐（仅个性化模式） */}
          {result && (
            <div>
              <h2 className="font-heading text-[17px] font-bold">{t('cmp.recommend')}</h2>
              <p className="mt-1 font-mono text-[10px] text-ink-soft">{t('cmp.recommend.note')}</p>
              <div className="mt-3 flex flex-col gap-2.5">
                {result.matches.map((m) => {
                  const added = selected.includes(m.city.id);
                  return (
                    <div key={m.city.id} className="card-paper flex items-center gap-4 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-medium text-[14.5px]">{cityName(m.city)}</p>
                          <p className="font-mono text-[13px] text-clay">{m.match}%</p>
                        </div>
                        <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-ink/10">
                          <motion.div
                            className="h-full rounded-full bg-clay"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${m.match}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease }}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <FavButton
                          active={favIds.includes(m.city.id)}
                          onClick={() => toggleFav(m.city.id)}
                          label={favIds.includes(m.city.id) ? t('cmp.fav.remove', { name: cityName(m.city) }) : t('cmp.fav.add', { name: cityName(m.city) })}
                        />
                        <button
                          type="button"
                          onClick={() => addCity(m.city.id)}
                          disabled={added}
                          className={`rounded-[6px] border px-3 py-1.5 font-mono text-[10.5px] transition-colors ${
                            added
                              ? 'border-ink/10 text-ink-soft/60'
                              : 'border-clay/50 text-clay hover:bg-clay hover:text-paper'
                          }`}
                        >
                          {added ? t('cmp.added') : t('cmp.addToCompare')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 权重滑杆 */}
      <section className="border-t hairline bg-paper-deep/40">
        <div className="mx-auto max-w-almanac px-6 py-10 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">{t('cmp.sec.weights.eyebrow')}</p>
              <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight md:text-[26px]">{t('cmp.sec.weights.title')}</h2>
            </div>
            <div className="flex items-center gap-3">
              {!isDefaultWeights(weights, personalized) && (
                <button type="button" onClick={resetWeights} className="btn-ghost font-mono text-[11px]">
                  {t('cmp.weights.reset')}
                </button>
              )}
              <span className="font-mono text-[10px] text-ink-soft">
                {personalized ? t('cmp.weights.engineDefault') : t('cmp.weights.neutralDefault')}
              </span>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-[1.7] text-ink-soft">
            {t('cmp.weights.note')}
          </p>

          <div className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {PREFERENCE_DIMENSIONS.map((d) => {
              const share = weightShare(weights, d.key);
              return (
                <div key={d.key}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <label htmlFor={`w-${d.key}`} className="text-[12px] text-ink">
                      {dimensionLabel(d.key)}
                      {d.objective && (
                        <span className="ml-1.5 rounded-[3px] border border-teal/45 px-1 py-px font-mono text-[8.5px] text-teal">
                          {t('cmp.weights.objective')}
                        </span>
                      )}
                    </label>
                    <span className="font-mono text-[10.5px] text-clay">{share}%</span>
                  </div>
                  <input
                    id={`w-${d.key}`}
                    type="range"
                    min={0}
                    max={5}
                    step={0.1}
                    value={weights[d.key] ?? 1}
                    title={d.desc}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [d.key]: Number(e.target.value) }))}
                    className="w-full accent-[#EE6C4D]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 排名榜 */}
      {ranked.length > 0 && (
        <section className="mx-auto max-w-almanac px-6 py-10 md:px-10">
          <p className="eyebrow">{t('cmp.sec.rank.eyebrow')}</p>
          <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight md:text-[26px]">{t('cmp.sec.rank.title')}</h2>
          <div className="mt-6 flex flex-col gap-3">
            {ranked.map((r, i) => (
              <motion.div
                key={r.city.id}
                layout
                transition={{ duration: 0.45, ease }}
                className="card-paper flex items-center gap-4 px-5 py-4"
              >
                <span className="w-8 shrink-0 font-mono text-[15px] text-ink-soft">{String(i + 1).padStart(2, '0')}</span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: r.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium text-[15.5px]">
                      {cityName(r.city)}
                      {i === 0 && ranked.length > 1 && (
                        <span className="ml-2 rounded-[4px] border border-moss/50 bg-moss/[0.08] px-1.5 py-0.5 font-mono text-[9px] text-moss">
                          {t('cmp.weights.best')}
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[16px] text-ink">{r.composite}</p>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="h-[5px] min-w-[72px] flex-1 overflow-hidden rounded-full bg-ink/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: r.color }}
                        animate={{ width: `${r.composite}%` }}
                        transition={{ duration: 0.55, ease }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[9.5px] text-ink-soft">
                      {t('cmp.rank.breakdown', { p: r.personalityFit ?? '—', f: r.prefWeighted ?? '—', i: r.interestFit ?? '—' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 图表与数据卡 */}
      <CompareCharts rows={rows} />
      <CompareDataCards rows={rows} />

      {/* 决策备注 + 存档 */}
      {rows.length > 0 && (
        <section className="border-t hairline">
          <div className="mx-auto max-w-almanac px-6 py-12 md:px-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">{t('cmp.sec.notes.eyebrow')}</p>
                <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight md:text-[26px]">{t('cmp.sec.notes.title')}</h2>
              </div>
              <button type="button" onClick={saveArchive} className="btn-clay font-mono text-[11.5px]">
                {t('cmp.save.cta')}
              </button>
            </div>
            <p className="mt-2 font-mono text-[10px] text-ink-soft">{t('cmp.notes.autosave')}</p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="card-paper block p-4">
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">{t('cmp.notes.group')}</span>
                <textarea
                  value={overallNote}
                  onChange={(e) => setOverallNote(e.target.value)}
                  rows={4}
                  placeholder={t('cmp.note.placeholder')}
                  className="w-full resize-none bg-transparent text-[13px] leading-[1.8] text-ink outline-none placeholder:text-ink-soft/50"
                />
              </label>
              {rows.map((r) => (
                <label key={r.city.id} className="card-paper block p-4">
                  <span className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                    <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: r.color }} />
                    {t('cmp.note.label', { name: cityName(r.city) })}
                  </span>
                  <textarea
                    value={cityNotes[r.city.id] ?? ''}
                    onChange={(e) => setCityNotes((prev) => ({ ...prev, [r.city.id]: e.target.value }))}
                    rows={4}
                    placeholder={t('cmp.note.ph', { name: cityName(r.city) })}
                    className="w-full resize-none bg-transparent text-[13px] leading-[1.8] text-ink outline-none placeholder:text-ink-soft/50"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 换城弹窗 */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-5" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease }}
            className="card-paper w-full max-w-md p-6"
          >
            <div className="flex items-center gap-2.5">
              <CompassMark size={22} />
              <h3 className="font-heading text-[17px] font-bold">{t('cmp.replace.title', { limit: COMPARE_CITY_LIMIT })}</h3>
            </div>
            <p className="mt-2 text-[13px] leading-[1.7] text-ink-soft">
              {t('cmp.replace.desc1')} <span className="text-ink">{cityName(pending)}</span> {t('cmp.replace.desc2')}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {selected.map((id, i) => {
                const c = cityById.get(id);
                if (!c) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => replaceAt(i)}
                    className="flex items-center justify-between rounded-[7px] border border-ink/12 bg-paper px-4 py-2.5 text-left transition-colors hover:border-clay/50 hover:bg-clay/[0.05]"
                  >
                    <span className="flex items-center gap-2 text-[13px]">
                      <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }} />
                      {cityName(c)}
                    </span>
                    <span className="font-mono text-[10px] text-clay">{t('cmp.replace.cta', { name: cityName(pending) })}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setPendingCity(null)}
              className="mt-4 w-full rounded-[7px] border border-ink/15 py-2 font-mono text-[11px] text-ink-soft transition-colors hover:bg-ink/5"
            >
              {t('common.cancel')}
            </button>
          </motion.div>
        </div>
      )}

      {/* 保存成功提示 */}
      {savedToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-moss/50 bg-card px-5 py-2.5 font-mono text-[11px] text-moss shadow-[0_4px_18px_rgba(31,45,40,0.18)]">
          {t('cmp.save.done')}
        </div>
      )}
    </div>
  );
}
