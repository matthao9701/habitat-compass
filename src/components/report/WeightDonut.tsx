import { motion } from 'framer-motion';
import { WEIGHTS } from '../../lib/engine';
import { useI18n } from '../../i18n';

const ease = [0.22, 1, 0.36, 1] as const;

interface WeightDonutProps {
  /** Top1 城市的三项子分数（0-100）；null = 该城市无此维数据，段保持弱色 */
  personality: number | null;
  lifestyle: number | null;
  interest: number | null;
  /** Top1 匹配度总分 */
  total: number;
}

interface Segment {
  key: 'personality' | 'lifestyle' | 'interest';
  label: string;
  weight: number;
  score: number | null;
  color: string;
}

/** 模块一：评分构成分析——三段环形图，段宽 = 引擎权重，段深 = 实际得分 */
export default function WeightDonut({ personality, lifestyle, interest, total }: WeightDonutProps) {
  const { t } = useI18n();
  const segments: Segment[] = [
    { key: 'personality', label: t('report.donut.personality'), weight: Math.round(WEIGHTS.personality * 100), score: personality, color: '#C96A52' },
    { key: 'lifestyle', label: t('quiz.transition.ls'), weight: Math.round(WEIGHTS.preference * 100), score: lifestyle, color: '#1D3557' },
    { key: 'interest', label: t('quiz.transition.interests'), weight: Math.round(WEIGHTS.interest * 100), score: interest, color: '#B98A2F' },
  ];

  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
      {/* 环图 */}
      <div className="relative h-[148px] w-[148px] shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(251,248,239,0.08)" strokeWidth="15" />
          {segments.map((seg, i) => {
            const frac = seg.weight / 100;
            const dash = `${frac * c} ${c}`;
            const rotation = offset;
            offset += frac * c;
            return (
              <motion.circle
                key={seg.key}
                cx="64"
                cy="64"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="15"
                strokeDasharray={dash}
                initial={{ strokeDashoffset: -rotation, opacity: 0 }}
                animate={{
                  strokeDashoffset: -rotation,
                  opacity: seg.score != null ? 0.45 + (seg.score / 100) * 0.55 : 0.22,
                }}
                transition={{ duration: 0.9, delay: 0.35 + i * 0.15, ease }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-[9px] uppercase tracking-eyebrow text-paper/50">{t('report.donut.total')}</p>
          <p className="font-mono text-[30px] font-semibold leading-tight text-paper">
            {total}
            <span className="text-[13px]">%</span>
          </p>
        </div>
      </div>

      {/* 图例：权重 + 实际得分 */}
      <div className="w-full max-w-xs space-y-4">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.45 + i * 0.12, ease }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 text-[12.5px] text-paper/85">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-[3px]"
                  style={{ backgroundColor: seg.color }}
                />
                {seg.label}
              </span>
              <span className="font-mono text-[10.5px] text-paper/55">{t('wd.segWeight', { pct: seg.weight })}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-paper/10">
                {seg.score != null ? (
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: seg.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${seg.score}%` }}
                    transition={{ duration: 0.9, delay: 0.55 + i * 0.12, ease }}
                  />
                ) : null}
              </div>
              {seg.score != null ? (
                <span className="w-9 text-right font-mono text-[11px] text-paper">{seg.score}</span>
              ) : (
                <span className="w-9 text-right font-mono text-[11px] text-paper/35">—</span>
              )}
            </div>
          </motion.div>
        ))}
        <p className="border-t border-paper/15 pt-3 font-mono text-[9.5px] leading-[1.8] text-paper/45">
          {t('wd.note')}
        </p>
      </div>
    </div>
  );
}
