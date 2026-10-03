// 我的 Tab：测验历史（简易/标准双版） / 收藏城市 / 已保存的对比 / 标准版虚拟订单
import { useState, type JSX } from 'react';
import { motion } from 'framer-motion';
import CompassMark from './CompassMark';
import * as storage from '../lib/storage';
import { PRO_PRICE_CNY } from '../lib/storage';
import { cities } from '../data';
import { getFunnel, type FunnelEvent, type FunnelData } from '../lib/telemetry';
import { useI18n, translate, getCurrentLang } from '../i18n';
import { cityName, formatMoney } from '../lib/format';

const ease = [0.22, 1, 0.36, 1] as const;

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number): string => String(n).padStart(2, '0');
  if (getCurrentLang() === 'en') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 支付渠道中文名（工厂：渲染期取当前语言） */
function channelLabels(): Record<string, string> {
  const { t } = useI18n();
  const L = (k: string): string => translate(getCurrentLang(), k);
  return { alipay: L('bill.channel.alipay'), wechat: L('bill.channel.wechat'), card: L('bill.channel.card') };
}

interface ProfileScreenProps {
  onOpenQuiz: (version?: 'lite' | 'pro') => void;
  onOpenHistory: (version?: 'lite' | 'pro') => void;
  onOpenCompare: (seed?: string[]) => void;
  onProIntro: () => void;
}

export default function ProfileScreen({
  onOpenQuiz,
  onOpenHistory,
  onOpenCompare,
  onProIntro,
}: ProfileScreenProps) {
  const { t } = useI18n();
  const [history] = useState(() => storage.loadHistory());
  const [proHistory] = useState(() => storage.loadProHistory());
  const [favorites, setFavorites] = useState<string[]>(() => storage.loadFavorites());
  const [archives, setArchives] = useState(() => storage.loadArchives());
  const [unlocked, setUnlocked] = useState(() => storage.isProUnlocked());
  const [orders, setOrders] = useState(() => storage.loadOrders());
  const [confirmReset, setConfirmReset] = useState(false);

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

  /** 演示用：重置购买记录（二次确认后清空订单 + 解锁状态） */
  function doResetBilling(): void {
    storage.resetBilling();
    setUnlocked(storage.isProUnlocked());
    setOrders(storage.loadOrders());
    setConfirmReset(false);
  }

  function HistoryCard({ version }: { version: 'lite' | 'pro' }): JSX.Element {
    const entry = version === 'pro' ? proHistory : history;
    if (!entry) {
      return (
        <div className="mt-4 rounded-[10px] border border-dashed border-ink/20 bg-card/60 p-5 text-center">
          <p className="text-[13px] leading-[1.7] text-ink-soft">
            {version === 'pro' ? t('profile.empty.pro') : t('profile.empty.lite')}
          </p>
          <button
            type="button"
            onClick={() => (version === 'pro' ? onProIntro() : onOpenQuiz())}
            className="btn-ghost mt-3 font-mono text-[11px]"
          >
            {version === 'pro' ? t('profile.cta.proIntro') : t('profile.cta.quiz')}
          </button>
        </div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="card-paper mt-4 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              {version === 'pro' ? 'STANDARD · ' : 'LITE · '}
              {fmtDate(entry.savedAt)}
            </p>
            <p className="mt-1 flex items-center gap-2 font-data text-[24px] font-semibold tracking-wide text-ink">
              {entry.result.typeCode}
              {version === 'pro' && (
                <span className="rounded border border-ochre px-1 py-0.5 font-data text-[9px] tracking-[0.15em] text-ochre">
                  PRO
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">Top 1</p>
            <p className="mt-1 text-[13.5px] text-ink">
              {entry.result.matches[0] ? cityName(entry.result.matches[0].city) : '—'}
              <span className="ml-1.5 font-mono text-[12px] text-clay">
                {entry.result.matches[0]?.match ?? '—'}%
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.result.profileTags.slice(0, 6).map((t) => (
            <span
              key={t}
              className="rounded-[4px] border border-ink/12 px-1.5 py-0.5 font-mono text-[9.5px] text-ink-soft"
            >
              {t}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onOpenHistory(version)}
          className="btn-clay mt-5 w-full font-mono text-[11.5px]"
        >
          {t('pf.report.open')}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-almanac px-6 pb-20 pt-10 md:px-10">
      <p className="eyebrow">my · 01</p>
      <h1 className="mt-2 font-display text-[26px] font-bold tracking-tight md:text-[32px]">{t('profile.title')}</h1>
      <p className="mt-3 max-w-lg text-[13.5px] leading-[1.8] text-ink-soft">
        {t('pf.desc')}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* 简易版历史 */}
        <section>
          <div className="flex items-center gap-2.5">
            <CompassMark size={18} />
            <h2 className="font-heading text-[17px] font-bold">{t('profile.history.lite')}</h2>
          </div>
          <HistoryCard version="lite" />
        </section>

        {/* 标准版历史 */}
        <section>
          <div className="flex items-center gap-2.5">
            <CompassMark size={18} />
            <h2 className="font-heading text-[17px] font-bold">{t('profile.history.pro')}</h2>
            {unlocked && (
              <span className="rounded border border-moss/60 bg-moss/10 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-moss">
                UNLOCKED
              </span>
            )}
          </div>
          <HistoryCard version="pro" />
        </section>

        {/* 收藏城市 */}
        <section>
          <div className="flex items-center gap-2.5">
            <CompassMark size={18} />
            <h2 className="font-heading text-[17px] font-bold">{t('profile.favorites')}</h2>
            <span className="font-mono text-[10px] text-ink-soft">{favCities.length}</span>
          </div>
          {favCities.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {favCities.map((c) => (
                <div key={c.id} className="card-paper p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium text-[15px]">{cityName(c)}</p>
                    <span className="font-mono text-[10px] text-ink-soft">{c.countryZh}</span>
                  </div>
                  <p className="mt-1.5 font-mono text-[10.5px] text-ink-soft">
                    {c.monthlyCostUSD != null ? t('cost.perMonth', { cost: formatMoney(c.monthlyCostUSD) }) : t('cost.naLong')} ·{' '}
                    {c.internetMbps != null ? `${c.internetMbps} Mbps` : '— Mbps'} ·{' '}
                    {c.digitalNomadVisa === true ? (
                      <span className="text-moss">{t('profile.visa.yes')}</span>
                    ) : (
                      <span>{t('pf.visaPrefix', { v: c.digitalNomadVisa === false ? '—' : t('profile.visa.pending') })}</span>
                    )}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenCompare([c.id])}
                      className="flex-1 rounded-[6px] border border-clay/50 px-2 py-1.5 font-mono text-[10.5px] text-clay transition-colors hover:bg-clay hover:text-paper"
                    >
                      {t('pf.fav.add')}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFavorite(c.id)}
                      className="rounded-[6px] border border-ink/15 px-2 py-1.5 font-mono text-[10.5px] text-ink-soft transition-colors hover:border-clay/50 hover:text-clay"
                    >
                      {t('pf.fav.remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[10px] border border-dashed border-ink/20 bg-card/60 p-6 text-center">
              <p className="text-[13px] leading-[1.7] text-ink-soft">
                {t('pf.fav.empty')}
              </p>
              <button type="button" onClick={() => onOpenCompare()} className="btn-ghost mt-3 font-mono text-[11px]">
                {t('pf.fav.goto')}
              </button>
            </div>
          )}
        </section>

        {/* 标准版 · 虚拟订单 */}
        <section>
          <div className="flex items-center gap-2.5">
            <CompassMark size={18} />
            <h2 className="font-heading text-[17px] font-bold">{t('profile.orders')}</h2>
          </div>
          <div className="mt-4 rounded-[10px] border hairline bg-card/70 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] text-ink-soft">
                {unlocked ? (
                  <>
                    {t('pf.pro.label')}<span className="font-medium text-moss">{t('profile.unlocked')}</span>{t('pf.pro.permanent')}
                  </>
                ) : (
                  t('profile.notUnlocked')
                )}
              </p>
              {!unlocked && (
                <button
                  type="button"
                  onClick={onProIntro}
                  className="rounded-[6px] border border-clay/50 px-2.5 py-1 font-mono text-[10.5px] text-clay transition-colors hover:bg-clay hover:text-paper"
                >
                  {t('pf.pro.unlockCta', { price: PRO_PRICE_CNY.toFixed(1) })}
                </button>
              )}
            </div>

            {orders.length > 0 ? (
              <div className="divide-y divide-ink/10 border-t border-ink/10">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-data text-[12px] text-ink">{o.id}</p>
                      <p className="font-mono text-[9.5px] text-ink-soft">
                        {fmtDate(o.createdAt)} · {channelLabels()[o.channel] ?? o.channel}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="font-data text-[13px] tabular-nums text-ink">
                        ¥{o.amountCny.toFixed(1)}
                      </span>
                      <span className="rounded-full bg-moss/15 px-2 py-0.5 font-mono text-[9.5px] text-moss">
                        {o.status === 'paid' ? t('profile.order.paid') : o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="border-t border-ink/10 pt-3 text-[12.5px] leading-relaxed text-ink-soft">
                {t('pf.orders.empty', { price: PRO_PRICE_CNY.toFixed(1) })}
              </p>
            )}

            <p className="mt-3 font-mono text-[9.5px] text-ink-soft/70">
              {t('bill.demoNotice')}
            </p>

            {orders.length > 0 && (
              <div className="mt-3 border-t border-ink/10 pt-3">
                {confirmReset ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] text-clay-deep">
                      {t('pf.orders.resetConfirm')}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={doResetBilling}
                        className="rounded-[6px] bg-clay-deep px-2.5 py-1 font-mono text-[10.5px] text-paper"
                      >
                        {t('pf.orders.resetYes')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="rounded-[6px] border border-ink/15 px-2.5 py-1 font-mono text-[10.5px] text-ink-soft"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="font-mono text-[10.5px] text-ink-soft underline-offset-4 transition-colors hover:text-clay-deep hover:underline"
                  >
                    {t('pf.orders.reset')}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 已保存的对比 */}
      <section className="mt-12">
        <div className="flex items-center gap-2.5">
          <CompassMark size={18} />
          <h2 className="font-heading text-[17px] font-bold">{t('profile.archives')}</h2>
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
                      {fmtDate(a.savedAt)} · {a.personalized ? t('profile.archives.personal') : t('profile.archives.neutral')}
                    </p>
                    <p className="mt-1 truncate text-[13.5px] text-ink">{names}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">{t('profile.archives.topScore')}</p>
                    <p className="font-mono text-[15px] text-clay">{best?.score ?? '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => loadArchive(a.id)}
                      className="rounded-[6px] border border-clay/50 px-3 py-1.5 font-mono text-[10.5px] text-clay transition-colors hover:bg-clay hover:text-paper"
                    >
                      {t('pf.archives.load')}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeArchive(a.id)}
                      className="rounded-[6px] border border-ink/15 px-3 py-1.5 font-mono text-[10.5px] text-ink-soft transition-colors hover:border-clay/50 hover:text-clay"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[10px] border border-dashed border-ink/20 bg-card/60 p-6 text-center">
            <p className="text-[13px] leading-[1.7] text-ink-soft">
              {t('pf.archives.empty')}
            </p>
          </div>
        )}
      </section>

      {/* 数据概览（第六轮）：本地漏斗计数，纯前端 localStorage，不采集任何个人信息 */}
      <FunnelSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 数据概览：本地使用漏斗（折叠区）
// ---------------------------------------------------------------------------

/** 漏斗行标签（工厂：渲染期取当前语言） */
function funnelRows(): { event: FunnelEvent; label: string }[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  return [
    { event: 'quiz_version_lite', label: L('profile.funnel.label.versionLite') },
    { event: 'quiz_version_pro', label: L('profile.funnel.label.versionPro') },
    { event: 'hard_constraints_used', label: L('profile.funnel.label.hardConstraints') },
    { event: 'pro_intro_view', label: L('profile.funnel.label.proIntro') },
    { event: 'pay_click', label: L('profile.funnel.label.payClick') },
    { event: 'unlock_success', label: L('profile.funnel.label.unlock') },
    { event: 'report_generated', label: L('profile.funnel.label.report') },
  ];
}

function FunnelSection() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // 每次展开时读取最新计数
  const funnel: FunnelData = open ? getFunnel() : {};
  const stageRows = Object.entries(funnel)
    .filter(([k]) => k.startsWith('stage_'))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="mt-12">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 text-left"
        aria-expanded={open}
      >
        <CompassMark size={18} />
        <h2 className="font-heading text-[17px] font-bold">{t('profile.funnel.title')}</h2>
        <span className="font-mono text-[9.5px] text-ink-soft">{t('profile.funnel.note')}</span>
        <span className="ml-auto font-mono text-[11px] text-ink-soft">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div className="mt-4 rounded-[10px] border hairline bg-card/70 p-5">
          <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
            {t('pf.funnel.eyebrow')}
          </p>
          <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {funnelRows().map((row) => {
              const hit = funnel[row.event]?.count ?? 0;
              return (
                <div key={row.event} className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] text-ink-soft">{row.label}</span>
                  <span className={`font-data text-[12px] tabular-nums ${hit > 0 ? 'text-ink' : 'text-ink-soft/50'}`}>
                    {t('pf.funnel.times', { count: hit })}
                  </span>
                </div>
              );
            })}
          </div>
          {stageRows.length > 0 ? (
            <>
              <p className="mt-5 font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
                {t('pf.funnel.stages')}
              </p>
              <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {stageRows.map(([event, meta]) => (
                  <div key={event} className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[10.5px] text-ink-soft">{event}</span>
                    <span className="font-data text-[12px] tabular-nums text-ink">{t('pf.funnel.times', { count: meta.count })}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          <p className="mt-5 border-t hairline pt-3 font-mono text-[9px] leading-[1.8] text-ink-soft/70">
            {t('pf.funnel.note')}
          </p>
        </div>
      ) : null}
    </section>
  );
}
