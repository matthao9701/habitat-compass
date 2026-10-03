// 我的 Tab：测验历史 / 收藏城市 / 已保存的对比
import { useState } from 'react';
import { motion } from 'framer-motion';
import CompassMark from './CompassMark';
import * as storage from '../lib/storage';
import { cities } from '../data';

const ease = [0.22, 1, 0.36, 1] as const;

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

interface ProfileScreenProps {
  onOpenQuiz: () => void;
  onOpenHistory: () => void;
  onOpenCompare: (seed?: string[]) => void;
}

export default function ProfileScreen({ onOpenQuiz, onOpenHistory, onOpenCompare }: ProfileScreenProps) {
  const [history] = useState(() => storage.loadHistory());
  const [favorites, setFavorites] = useState<string[]>(() => storage.loadFavorites());
  const [archives, setArchives] = useState(() => storage.loadArchives());

  const cityById = new Map(cities.map((c) => [c.id, c]));
  const favCities = favorites
    .map((id) => cityById.get(id))
    .filter((c): c is NonNullable<typeof c> => c != null);

  function removeFavorite(id: string): void {
    const next = favorites.filter((x) => x !== id);
    setFavorites(next);
    storage.saveFavorites(next);
  }

  function removeArchive(id: string): void {
    storage.removeArchive(id);
    setArchives(storage.loadArchives());
  }

  function loadArchive(id: string): void {
    const a = archives.find((x) => x.id === id);
    if (!a) return;
    storage.saveCompareState({
      selected: a.cities,
      weights: a.weights,
      cityNotes: a.cityNotes,
      overallNote: a.overallNote,
    });
    onOpenCompare(a.cities);
  }

  return (
    <div className="mx-auto max-w-almanac px-6 pb-20 pt-10 md:px-10">
      <p className="eyebrow">my · 01</p>
      <h1 className="mt-2 font-display text-[26px] font-bold tracking-tight md:text-[32px]">我的航海手账</h1>
      <p className="mt-3 max-w-lg text-[13.5px] leading-[1.8] text-ink-soft">
        收藏城市、回看测评历史与保存过的对比。数据仅存于本机浏览器。
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* 测验历史 */}
        <section>
          <div className="flex items-center gap-2.5">
            <CompassMark size={18} />
            <h2 className="font-heading text-[17px] font-bold">测验历史</h2>
          </div>
          {history ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}
              className="card-paper mt-4 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
                    {fmtDate(history.savedAt)}
                  </p>
                  <p className="mt-1 font-data text-[26px] font-semibold tracking-wide text-ink">{history.result.typeCode}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">Top 1</p>
                  <p className="mt-1 text-[13.5px] text-ink">
                    {history.result.matches[0]?.city.nameZh ?? '—'}
                    <span className="ml-1.5 font-mono text-[12px] text-clay">
                      {history.result.matches[0]?.match ?? '—'}%
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {history.result.profileTags.slice(0, 6).map((t) => (
                  <span key={t} className="rounded-[4px] border border-ink/12 px-1.5 py-0.5 font-mono text-[9.5px] text-ink-soft">
                    {t}
                  </span>
                ))}
              </div>
              <button type="button" onClick={onOpenHistory} className="btn-clay mt-5 w-full font-mono text-[11.5px]">
                查看完整报告 →
              </button>
            </motion.div>
          ) : (
            <div className="mt-4 rounded-[10px] border border-dashed border-ink/20 bg-card/60 p-6 text-center">
              <p className="text-[13px] leading-[1.7] text-ink-soft">还没有测评记录。</p>
              <button type="button" onClick={onOpenQuiz} className="btn-ghost mt-3 font-mono text-[11px]">
                去做测评 →
              </button>
            </div>
          )}
        </section>

        {/* 收藏城市 */}
        <section>
          <div className="flex items-center gap-2.5">
            <CompassMark size={18} />
            <h2 className="font-heading text-[17px] font-bold">收藏城市</h2>
            <span className="font-mono text-[10px] text-ink-soft">{favCities.length}</span>
          </div>
          {favCities.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {favCities.map((c) => (
                <div key={c.id} className="card-paper p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium text-[15px]">{c.nameZh}</p>
                    <span className="font-mono text-[10px] text-ink-soft">{c.countryZh}</span>
                  </div>
                  <p className="mt-1.5 font-mono text-[10.5px] text-ink-soft">
                    ~${c.monthlyCostUSD.toLocaleString('en-US')}/月 · {c.internetMbps} Mbps ·{' '}
                    {c.digitalNomadVisa ? <span className="text-moss">签证有</span> : <span>签证 —</span>}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenCompare([c.id])}
                      className="flex-1 rounded-[6px] border border-clay/50 px-2 py-1.5 font-mono text-[10.5px] text-clay transition-colors hover:bg-clay hover:text-paper"
                    >
                      加入对比
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFavorite(c.id)}
                      className="rounded-[6px] border border-ink/15 px-2 py-1.5 font-mono text-[10.5px] text-ink-soft transition-colors hover:border-clay/50 hover:text-clay"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[10px] border border-dashed border-ink/20 bg-card/60 p-6 text-center">
              <p className="text-[13px] leading-[1.7] text-ink-soft">
                还没有收藏。在「城市对比」页点击城市卡上的星标即可收藏。
              </p>
              <button type="button" onClick={() => onOpenCompare()} className="btn-ghost mt-3 font-mono text-[11px]">
                去城市对比 →
              </button>
            </div>
          )}
        </section>
      </div>

      {/* 已保存的对比 */}
      <section className="mt-12">
        <div className="flex items-center gap-2.5">
          <CompassMark size={18} />
          <h2 className="font-heading text-[17px] font-bold">保存的对比</h2>
          <span className="font-mono text-[10px] text-ink-soft">{archives.length}</span>
        </div>
        {archives.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {archives.map((a) => {
              const names = a.cities
                .map((id) => cityById.get(id)?.nameZh ?? id)
                .join(' · ');
              const best = a.composites.reduce<{ id: string; score: number } | null>(
                (acc, c) => (acc == null || c.score > acc.score ? c : acc),
                null,
              );
              return (
                <div key={a.id} className="card-paper flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
                      {fmtDate(a.savedAt)} · {a.personalized ? '个性化权重' : '中性基准'}
                    </p>
                    <p className="mt-1 truncate text-[13.5px] text-ink">{names}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">最高对比分</p>
                    <p className="font-mono text-[15px] text-clay">{best?.score ?? '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => loadArchive(a.id)}
                      className="rounded-[6px] border border-clay/50 px-3 py-1.5 font-mono text-[10.5px] text-clay transition-colors hover:bg-clay hover:text-paper"
                    >
                      载入对比
                    </button>
                    <button
                      type="button"
                      onClick={() => removeArchive(a.id)}
                      className="rounded-[6px] border border-ink/15 px-3 py-1.5 font-mono text-[10.5px] text-ink-soft transition-colors hover:border-clay/50 hover:text-clay"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[10px] border border-dashed border-ink/20 bg-card/60 p-6 text-center">
            <p className="text-[13px] leading-[1.7] text-ink-soft">
              还没有保存的对比。在「城市对比」页选好城市、写下备注后点「保存对比结果」。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
