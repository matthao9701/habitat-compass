import { motion } from 'framer-motion';
import CompassMark from '../CompassMark';

const ease = [0.22, 1, 0.36, 1] as const;

/** 数据条语义：绿=优势（≥75）、蓝=中等（50-74）、红=需注意（<50），全站统一 */
export function semTone(value: number): 'good' | 'mid' | 'low' {
  if (value >= 75) return 'good';
  if (value >= 50) return 'mid';
  return 'low';
}

export const TONE_BAR_COLOR: Record<'good' | 'mid' | 'low', string> = {
  good: 'bg-moss',
  mid: 'bg-sea',
  low: 'bg-clay-deep',
};

export const TONE_TEXT_COLOR: Record<'good' | 'mid' | 'low', string> = {
  good: 'text-moss-deep',
  mid: 'text-sea-deep',
  low: 'text-clay-deep',
};

interface SemBarProps {
  label: string;
  /** null = 该维度无数据，显示占位不渲染条 */
  value: number | null;
  /** 标签右侧的补充说明（如「选 3」） */
  note?: string;
  delay?: number;
}

/** 好差分色数据条：右标数值，颜色按 75 / 50 阈值切换；无数据显示 — */
export function SemBar({ label, value, note, delay = 0 }: SemBarProps) {
  const tone = value != null ? semTone(value) : null;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] text-ink">
          {label}
          {note ? <span className="ml-1.5 font-mono text-[10px] text-ink-soft">{note}</span> : null}
        </span>
        {value != null && tone ? (
          <span className={`font-mono text-[10.5px] ${TONE_TEXT_COLOR[tone]}`}>{value}</span>
        ) : (
          <span className="font-mono text-[10.5px] text-ink-soft">—</span>
        )}
      </div>
      {value != null && tone ? (
        <div className="h-[5px] overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className={`h-full rounded-full ${TONE_BAR_COLOR[tone]}`}
            initial={{ width: 0 }}
            whileInView={{ width: `${value}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay, ease }}
          />
        </div>
      ) : (
        <div className="h-[5px] overflow-hidden rounded-full bg-ink/10" />
      )}
    </div>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  desc?: string;
}

/** 新模块小标题：罗盘花图标 + eyebrow + 衬线标题 */
export function SectionHeading({ eyebrow, title, desc }: SectionHeadingProps) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <CompassMark size={18} className="text-ochre-deep" />
        <p className="eyebrow !mb-0">{eyebrow}</p>
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      {desc ? <p className="mt-2 text-[13px] text-ink-soft">{desc}</p> : null}
    </div>
  );
}
