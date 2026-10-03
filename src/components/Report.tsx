import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CompassMark from './CompassMark';
import RadarChart from './RadarChart';
import { mbtiProfiles } from '../data/mbtiProfiles';
import { interestLabelById } from '../data/interests';
import type { AssessmentResult, AxisName, CityMatch } from '../lib/engine';
import {
  formatCost,
  CLIMATE_LABEL,
  INTERNET_LABEL,
} from '../lib/engine';
import { cityPros, cityCons, settlementBadge, type BadgeLevel } from '../lib/analysis';
import WeightDonut from './report/WeightDonut';
import BreakdownSection from './report/BreakdownSection';
import CityAnalysisSection from './report/CityAnalysisSection';
import TrialSection from './report/TrialSection';
import BigFiveSection from './report/BigFiveSection';
import ConstraintsNotice from './report/ConstraintsNotice';
import CountryCards from './report/CountryCards';
import VerificationChecklist from './report/VerificationChecklist';
import { MBTI_SOURCE } from '../data/questions';

interface ReportProps {
  result: AssessmentResult;
  onRestart: () => void;
  /** 演示档案模式：顶部徽标 + 底部引导 CTA */
  isDemo?: boolean;
  onStartQuiz?: () => void;
}

const RADAR_AXES = ['成本', '网络', '安全', '社区', '英语', '签证'];

const RADAR_COLORS = ['#BE5A38', '#335043', '#B08544'];

const ease = [0.22, 1, 0.36, 1] as const;

export default function Report({ result, onRestart, isDemo = false, onStartQuiz }: ReportProps) {
  const profile = mbtiProfiles[result.typeCode];
  const [copied, setCopied] = useState(false);
  const top = result.matches[0];

  const radarSeries = result.matches
    .slice(0, 3)
    .map((m, i) => ({
      id: m.city.id,
      label: m.city.nameZh,
      color: RADAR_COLORS[i],
      values: [
        m.scores.cost,
        m.scores.internet,
        m.scores.safety,
        m.scores.community,
        m.scores.english,
        m.scores.visa,
      ] as (number | null)[],
    }))
    .filter((s): s is typeof s & { values: number[] } => s.values.every((v): v is number => v != null));

  async function copySummary(): Promise<void> {
    const text = buildSummaryText(result);
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      ok = legacyCopy(text);
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <div className="grain min-h-screen bg-paper text-ink">
      {/* 顶栏 */}
      <header className="border-b hairline">
        <div className="mx-auto flex max-w-almanac items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2.5">
            <CompassMark size={26} />
            <span className="font-display text-[15px] font-bold tracking-wide">栖居罗盘</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
            your report
          </p>
        </div>
      </header>

      {/* 报告头部：深墨绿 */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-eyebrow text-paper/55"
          >
            {isDemo ? (
              <span className="rounded-full border border-clay bg-clay px-3 py-1 text-paper">
                演示档案 · demo
              </span>
            ) : null}
            assessment complete · 56 answers
          </motion.p>
          <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease }}
                className="font-display text-[54px] font-black leading-none tabular-nums md:text-[84px]"
              >
                {result.typeCode}
              </motion.h1>
              <p className="mt-4 font-heading text-xl font-bold text-paper/85">
                {profile?.name ?? ''} · {profile?.motto ?? ''}
              </p>
            </div>
            <div className="max-w-sm">
              <p className="text-[14px] leading-[1.9] text-paper/75">{profile?.desc ?? ''}</p>
              <p className="mt-4 border-l-2 border-clay pl-4 text-[15px] font-light leading-relaxed text-paper/85">
                {profile?.nomadStyle ?? ''}
              </p>
            </div>
          </div>

          {/* 用户画像标签 */}
          <div className="mt-10 flex flex-wrap gap-2">
            {result.profileTags.map((tag, i) => (
              <motion.span
                key={`${tag}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.04 }}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] ${
                  i === 0
                    ? 'border-clay bg-clay text-paper'
                    : 'border-paper/25 text-paper/75'
                }`}
              >
                {tag}
              </motion.span>
            ))}
          </div>

          {/* 四轴偏好百分比 */}
          <div className="mt-10 border-t border-paper/15 pt-8">
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-paper/45">
              axis preference · 四轴偏好
            </p>
            <div className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {AXIS_ROWS.map((row, i) => (
                <AxisBar
                  key={row.key}
                  left={row.left}
                  right={row.right}
                  percent={result.axisScores[row.key]}
                  delay={0.3 + i * 0.08}
                />
              ))}
            </div>
          </div>

          {/* 评分构成分析：权重环图 + 实际得分 */}
          {top ? (
            <div className="mt-10 border-t border-paper/15 pt-8">
              <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-paper/45">
                score composition · 评分构成
              </p>
              <div className="mt-6">
                <WeightDonut
                  personality={top.personalityFit}
                  lifestyle={top.preferenceFit}
                  interest={top.interestFit}
                  total={top.match}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* 硬性条件过滤说明（第六轮）：打分前一票否决的可解释性声明 */}
      {result.constraints?.applied ? (
        <ConstraintsNotice
          excluded={result.constraints.excluded}
          relaxed={result.constraints.relaxed}
          overBudgetCount={result.constraints.overBudgetIds.length}
        />
      ) : null}

      {/* 雷达图 */}
      <section className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-20">
        <p className="eyebrow mb-3">dimension compare</p>
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
          Top 3 城市六维对比
        </h2>
        <p className="mb-10 text-[13px] text-ink-soft">
          成本、网络、安全、社区、英语友好与签证灵活度（归一化 0-100）
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="card-paper px-4 py-10 md:px-10"
        >
          <RadarChart axes={RADAR_AXES} series={radarSeries} />
        </motion.div>
      </section>

      {/* 标准版增强：Big Five 剖面 + 30 facets + 映射说明 + 两版对比 */}
      {result.version === 'pro' && result.proProfile ? (
        <BigFiveSection result={result} proProfile={result.proProfile} />
      ) : null}

      {/* 细分拆解：兴趣 6 类 + 生活偏好 8 维（Top 1） */}
      {top ? <BreakdownSection top={top} userInterests={result.interests} /> : null}

      {/* Top 5 卡片 */}
      <section className="mx-auto max-w-almanac px-6 pb-16 md:px-10 md:pb-24">
        <p className="eyebrow mb-3">your top 5</p>
        <h2 className="mb-10 font-display text-2xl font-bold tracking-tight md:text-3xl">最适合你的 5 座城市</h2>
        <div className="space-y-5">
          {result.matches.map((m, i) => (
            <CityCard key={m.city.id} match={m} rank={i + 1} />
          ))}
        </div>

        <p className="mt-8 border-t hairline pt-5 font-mono text-[9.5px] leading-[1.9] text-ink-soft/80">
          数据口径 · 月均综合生活成本为「市区一居室租金 + 水电网 + 餐饮 + 交通」的估算值（USD），
          成本指数采用 Numbeo 口径（NYC=100），宽带速度为固定宽带中位数；气候指标为 Open-Meteo 历史再分析
          2015–2024 十年均值；安全/医疗/污染/通勤/气候等指数沿用 Numbeo Quality of Life 口径（0–100，NYC=100）。
          城市缺数据的维度以「—」标示，不参与打分。签证信息为 2026 年初政策快照，出行前请以官方最新信息为准。
        </p>
      </section>

      {/* 国家概况（第六轮）：参考信息层，不参与打分 */}
      <CountryCards matches={result.matches} />

      {/* 人格 × 城市 定性分析（Top 1） */}
      {top ? <CityAnalysisSection top={top} axisScores={result.axisScores} /> : null}

      {/* 先试住再决定（Top 1） */}
      {top ? <TrialSection top={top} /> : null}

      {/* 搬家前待核实清单（第六轮） */}
      <VerificationChecklist matches={result.matches} />

      {/* 演示档案引导 CTA */}
      {isDemo ? (
        <section className="border-y border-clay/40 bg-clay/[0.07]">
          <div className="mx-auto flex max-w-almanac flex-col items-center justify-between gap-5 px-6 py-9 text-center md:flex-row md:px-10 md:text-left">
            <div>
              <p className="font-heading text-lg font-bold text-ink">
                这是示例报告 —— 你的答案，可能指向完全不同的城市。
              </p>
              <p className="mt-1 text-[13px] text-ink-soft">
                三段测评约 12 分钟：MBTI 七级量表、生活情景选择、兴趣标签，无需注册。
              </p>
            </div>
            <button type="button" onClick={onStartQuiz} className="btn-clay shrink-0">
              开始我的正式测试
              <span className="font-mono text-xs opacity-80">→</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* 操作区 */}
      <section className="border-t hairline bg-paper-deep/60">
        <div className="mx-auto flex max-w-almanac flex-col items-center gap-5 px-6 py-14 text-center md:px-10">
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">把这份报告带走</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            复制完整文字摘要发给朋友，或重新测一次看看不同选择的结果。
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <button type="button" onClick={copySummary} className="btn-clay">
              {copied ? '已复制到剪贴板' : '一键复制报告摘要'}
            </button>
            {isDemo && onStartQuiz ? (
              <button type="button" onClick={onStartQuiz} className="btn-ghost !border-clay/60 !text-clay hover:!bg-clay hover:!text-paper">
                开始我的正式测试
              </button>
            ) : (
              <button type="button" onClick={onRestart} className="btn-ghost">
                重新测评
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 免责声明 */}
      <footer className="bg-ink">
        <div className="mx-auto max-w-almanac px-6 py-10 md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-paper/45">
            disclaimer
          </p>
          <p className="mt-3 max-w-3xl text-[12.5px] leading-[1.9] text-paper/60">
            本报告中的月生活成本、签证与居留政策均为参考快照，受汇率、季节、政策周期影响会发生变动；
            月均综合生活成本与成本指数（Numbeo 口径，NYC=100）为估算值，因个人生活方式而异；
            数字游民签证的收入门槛、停留时长与税务处理请以目的地官方移民机构及使领馆发布的最新信息为准。
            MBTI 测评题目基于 {MBTI_SOURCE.base}（{MBTI_SOURCE.publisher}）改编，
            以 {MBTI_SOURCE.license} 许可使用，人格类型仅供自我探索参考，不构成临床或职业建议。
            栖居罗盘提供决策参考，不构成移民、税务或法律建议。
          </p>
          <p className="mt-4 max-w-3xl text-[11px] font-light leading-relaxed text-paper/45">
            字体：思源黑体 / IBM Plex Mono / Source Serif 4（OFL 开源许可）
          </p>
          <p className="mt-1 max-w-3xl text-[11px] font-light leading-relaxed text-paper/45">
            数据来源：GeoNames（CC BY 4.0）· Open-Meteo Historical Weather API（CC BY 4.0）·
            Numbeo 公开指数（口径脚注见上）· EF English Proficiency Index
          </p>
          <p className="mt-6 font-mono text-[10px] text-paper/35">
            © 2025 栖居罗盘 · OVERSEAS SETTLEMENT ALMANAC
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 城市卡片
// ---------------------------------------------------------------------------

interface CityCardProps {
  match: CityMatch;
  rank: number;
}

const BAR_DIMS: { key: keyof CityMatch['scores']; label: string }[] = [
  { key: 'cost', label: '成本契合' },
  { key: 'internet', label: '网络' },
  { key: 'safety', label: '安全' },
  { key: 'community', label: '社区' },
  { key: 'english', label: '英语' },
  { key: 'visa', label: '签证' },
];

function CityCard({ match, rank }: CityCardProps) {
  const { city } = match;
  const cityInterests = city.tags
    .map((t) => interestLabelById.get(t) ?? t)
    .slice(0, 5);
  const badge = settlementBadge(match.match);
  const pros = cityPros(city);
  const cons = cityCons(city);

  const BADGE_STYLE: Record<BadgeLevel, string> = {
    good: 'border-moss/55 bg-moss/10 text-moss',
    mid: 'border-sea/55 bg-sea/10 text-sea',
    low: 'border-ink/25 bg-ink/[0.04] text-ink-soft',
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease }}
      className="card-paper overflow-hidden"
    >
      <div className="grid md:grid-cols-[300px_1fr]">
        {/* 左侧：标题与关键数据 */}
        <div className="border-b hairline p-6 md:border-b-0 md:border-r md:p-7">
          <div className="flex items-start justify-between">
            <p className="font-mono text-[11px] text-ochre">
              NO.{String(rank).padStart(2, '0')}
            </p>
            <CountUp value={match.match} />
          </div>
          <span
            title={badge.hint}
            className={`mt-3 inline-block rounded-full border px-3 py-1 font-mono text-[10.5px] ${BADGE_STYLE[badge.level]}`}
          >
            {badge.label}
          </span>
          {match.overBudget ? (
            <span
              title="月成本超出你设定的预算上限，但因剩余城市不足被放宽保留，匹配分已扣减"
              className="ml-2 inline-block rounded-full border border-ochre/60 bg-ochre/10 px-3 py-1 font-mono text-[10.5px] text-ochre"
            >
              超预算 · 降权保留
            </span>
          ) : null}
          <h3 className="mt-4 font-display text-[26px] font-bold leading-tight tracking-tight">
            {city.nameZh}
          </h3>
          <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-ink-soft">
            {city.nameEn} · {city.countryZh}
          </p>

          <dl className="mt-6 space-y-2.5 text-[12.5px]">
            <Stat label="月生活成本" value={formatCost(city)} />
            <Stat
              label="综合月均"
              value={city.monthlyCostUSD != null ? `~$${city.monthlyCostUSD.toLocaleString('en-US')}` : '—'}
            />
            <Stat label="成本指数" value={city.costIndex != null ? `${city.costIndex} · NYC=100` : '—'} />
            <Stat
              label="宽带中位"
              value={
                city.internetMbps != null && city.internet != null
                  ? `${city.internetMbps} Mbps · ${INTERNET_LABEL[city.internet]}`
                  : city.internetMbps != null
                    ? `${city.internetMbps} Mbps`
                    : '—'
              }
            />
            <Stat
              label="气候"
              value={
                city.climate != null && city.tempC != null
                  ? `${CLIMATE_LABEL[city.climate]} · 年均 ${city.tempC}°C`
                  : city.climateDetail != null
                    ? `年均 ${city.climateDetail.avgTempC}°C · ${city.climateDetail.summary}`
                    : '—'
              }
            />
            <Stat label="安全指数" value={city.safety != null ? `${city.safety} / 100` : '—'} />
            <Stat
              label="数字游民签证"
              value={city.digitalNomadVisa === true ? '有' : city.digitalNomadVisa === false ? '—' : '待核实'}
            />
            <Stat label="游民社区" value={city.community != null ? `${city.community} / 5` : '—'} />
          </dl>
        </div>

        {/* 右侧：理由 + 条形图 + 签证 */}
        <div className="p-6 md:p-7">
          <ul className="space-y-2.5">
            {match.reasons.map((reason, i) => (
              <li key={i} className="flex gap-3 text-[13.5px] leading-[1.75]">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                {reason}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {BAR_DIMS.map((d) => (
              <DimensionBar key={d.key} label={d.label} value={match.scores[d.key]} />
            ))}
          </div>

          <div className="mt-6 rounded-[6px] bg-paper-deep/70 px-4 py-3">
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              visa snapshot
            </p>
            <p className="mt-1.5 text-[12.5px] leading-[1.7]">{city.visaLabel}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {cityInterests.map((label) => (
              <span
                key={label}
                className="rounded-full border hairline px-2.5 py-1 text-[11px] text-ink-soft"
              >
                {label}
              </span>
            ))}
          </div>

          {/* 优势 / 注意事项：由城市库真实数据规则生成 */}
          <div className="mt-6 grid gap-x-8 gap-y-4 border-t hairline pt-5 sm:grid-cols-2">
            <div>
              <p className="mb-2.5 font-mono text-[9.5px] uppercase tracking-eyebrow text-moss">
                优势 · pros
              </p>
              <ul className="space-y-2">
                {pros.map((pro, i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-[1.7] text-ink">
                    <span className="shrink-0 font-mono text-moss">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2.5 font-mono text-[9.5px] uppercase tracking-eyebrow text-clay-deep">
                注意 · cautions
              </p>
              <ul className="space-y-2">
                {cons.map((con, i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-[1.7] text-ink">
                    <span className="shrink-0 font-mono text-clay-deep">!</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className="text-right font-mono text-[11.5px] text-ink">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 四轴偏好条（深色头部）
// ---------------------------------------------------------------------------

const AXIS_ROWS: { key: AxisName; left: string; right: string }[] = [
  { key: 'EI', left: 'E', right: 'I' },
  { key: 'SN', left: 'N', right: 'S' },
  { key: 'TF', left: 'F', right: 'T' },
  { key: 'JP', left: 'P', right: 'J' },
];

interface AxisBarProps {
  left: string;
  right: string;
  /** 偏向 left 字母的百分比（0-100） */
  percent: number;
  delay: number;
}

function AxisBar({ left, right, percent, delay }: AxisBarProps) {
  const leftStrong = percent >= 50;
  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-[10.5px]">
        <span className={leftStrong ? 'text-clay' : 'text-paper/40'}>
          {left} · {Math.round(percent)}%
        </span>
        <span className={!leftStrong ? 'text-clay' : 'text-paper/40'}>
          {right} · {Math.round(100 - percent)}%
        </span>
      </div>
      <div className="relative mt-1.5 h-[3px] rounded-full bg-paper/15">
        <span className="absolute left-1/2 top-[-2px] h-[7px] w-px bg-paper/30" aria-hidden="true" />
        <motion.div
          className={`h-full rounded-full bg-clay ${leftStrong ? '' : 'ml-auto'}`}
          initial={{ width: 0 }}
          animate={{ width: `${leftStrong ? percent : 100 - percent}%` }}
          transition={{ duration: 0.9, delay, ease }}
        />
      </div>
    </div>
  );
}

function DimensionBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) {
    return (
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[11.5px] text-ink-soft">{label}</span>
          <span className="font-mono text-[10.5px] text-ink-soft">—</span>
        </div>
        <div className="h-[4px] overflow-hidden rounded-full bg-ink/10" />
      </div>
    );
  }
  const tone =
    value >= 75
      ? { bar: 'bg-moss', text: 'text-moss' }
      : value >= 50
        ? { bar: 'bg-sea', text: 'text-sea' }
        : { bar: 'bg-clay-deep', text: 'text-clay-deep' };
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11.5px] text-ink-soft">{label}</span>
        <span className={`font-mono text-[10.5px] ${tone.text}`}>{value}</span>
      </div>
      <div className="h-[4px] overflow-hidden rounded-full bg-ink/10">
        <motion.div
          className={`h-full rounded-full ${tone.bar}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 匹配度滚动数字
// ---------------------------------------------------------------------------

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    function tick(now: number): void {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <p className="flex items-baseline font-mono text-clay">
      <span className="text-[30px] font-semibold leading-none">{display}</span>
      <span className="text-[13px]">%</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// 摘要文本与复制兜底
// ---------------------------------------------------------------------------

function buildSummaryText(result: AssessmentResult): string {
  const profile = mbtiProfiles[result.typeCode];
  const axisText = AXIS_ROWS.map(
    (row) =>
      `${row.left} ${Math.round(result.axisScores[row.key])}% / ${row.right} ${Math.round(100 - result.axisScores[row.key])}%`,
  ).join(' · ');
  const lines: string[] = [
    '【栖居罗盘 · 我的海外定居测评报告】',
    `MBTI：${result.typeCode} ${profile?.name ?? ''} — ${profile?.motto ?? ''}`,
    `四轴偏好：${axisText}`,
    `游民风格：${profile?.nomadStyle ?? ''}`,
    `用户画像：${result.profileTags.join(' / ')}`,
    '',
    'Top 5 推荐城市：',
  ];
  result.matches.forEach((m, i) => {
    lines.push(
      `${i + 1}. ${m.city.nameZh}（${m.city.countryZh}）匹配度 ${m.match}%` +
        `｜综合月均 ${m.city.monthlyCostUSD != null ? `~$${m.city.monthlyCostUSD.toLocaleString('en-US')}` : '暂缺'}` +
        `｜宽带 ${m.city.internetMbps ?? '—'} Mbps` +
        `｜数字游民签证 ${m.city.digitalNomadVisa ? '有' : '—'}｜${m.reasons[0]}`,
    );
  });
  lines.push(
    '',
    '月均综合生活成本为估算值（Numbeo 口径，NYC=100），因个人生活方式而异；',
    '生活成本与签证政策为参考快照，实际以官方最新信息为准。',
  );
  return lines.join('\n');
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}
