import { motion } from 'framer-motion';
import type { AssessmentResult } from '../../lib/engine';
import { SectionHeading } from './SemBar';
import { useI18n } from '../../i18n';
import { isMbtiTypeCode } from '../../data/mbtiProfiles';

const ease = [0.22, 1, 0.36, 1] as const;

interface ArchetypeSectionProps {
  result: AssessmentResult;
}

/**
 * 第一层 · 游牧生活形态原型：
 * 原型名（type.<CODE>.name） + 3 核心特质（type.<CODE>.traits.0..2） + 深度画像（type.<CODE>.desc）。
 * 不再以 MBTI 代号为主视觉，代号仅作小字附注（由原型名承载辨识度）。
 */
export default function ArchetypeSection({ result }: ArchetypeSectionProps) {
  const { t } = useI18n();
  const code = result.typeCode;
  const hasProfile = isMbtiTypeCode(code);
  if (!hasProfile) return null;

  // t() 对缺失键返回键本身；据此过滤掉未定义的 traits
  const traits = [0, 1, 2]
    .map((i) => t(`type.${code}.traits.${i}`))
    .filter((v, i) => v && v !== `type.${code}.traits.${i}`);
  const name = t(`type.${code}.name`);
  const motto = t(`type.${code}.motto`);
  const desc = t(`type.${code}.desc`);
  const style = t(`type.${code}.style`);

  return (
    <section className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-16">
      <SectionHeading
        eyebrow={t('rep.persona.eyebrow')}
        title={t('rep.persona.title')}
        desc={t('rep.persona.sub')}
      />
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="card-paper overflow-hidden"
      >
        <div className="grid md:grid-cols-[1fr_1.15fr]">
          {/* 左：原型名 + 代号小字 + 特质 */}
          <div className="border-b hairline bg-ink p-7 text-paper md:border-b-0 md:border-r md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-clay">
              nomad archetype
            </p>
            <h3 className="mt-3 font-display text-[30px] font-black leading-tight tracking-tight md:text-[36px]">
              {name}
            </h3>
            <p className="mt-2 text-[13.5px] font-light leading-relaxed text-paper/70">{motto}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-paper/40">
              {code}
            </p>

            <div className="mt-7">
              <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-paper/45">
                {t('rep.persona.traits')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {traits.map((trait, i) => (
                  <span
                    key={`${trait}-${i}`}
                    className="rounded-full border border-paper/25 px-3 py-1.5 font-mono text-[11px] text-paper/85"
                  >
                    {trait}                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 右：深度画像 + 风格 */}
          <div className="p-7 md:p-9">
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              {t('rep.persona.rhythm')}
            </p>
            <p className="mt-4 text-[14.5px] leading-[1.95] text-ink">{desc}</p>
            <p className="mt-6 border-l-2 border-clay pl-4 text-[14px] font-light leading-relaxed text-ink-soft">
              {style}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
