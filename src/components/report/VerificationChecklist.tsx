import type { CityMatch } from '../../lib/engine';
import { useI18n } from '../../i18n';
import { cityName, cityCountryName } from '../../lib/format';
import { visaLabelText } from '../../i18n/countryGlossary';

/**
 * VerificationChecklist — 报告页「搬家前待核实清单」模块（第六轮）
 * 针对 Top 推荐城市逐项列出需要线下核实的事项；查不到官方链接的统一标注
 * 「请自行搜索官方来源」，本站不代拟任何政策 URL。
 */
export default function VerificationChecklist({ matches }: { matches: CityMatch[] }) {
  const { t } = useI18n();
  const top = matches.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section className="border-y hairline bg-paper-deep/50">
      <div className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-20">
        <p className="eyebrow mb-3">before you move</p>
        <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {t('vc.title')}
        </h2>
        <p className="mb-10 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
          {t('vc.desc')}
        </p>

        <div className="space-y-5">
          {top.map((m, i) => (
            <ChecklistCard key={m.city.id} match={m} index={i + 1} />
          ))}
        </div>

        <p className="mt-8 border-t hairline pt-5 font-mono text-[10px] leading-[1.9] text-ink-soft">
          {t('vc.disclaimer')}
        </p>
      </div>
    </section>
  );
}

function ChecklistCard({ match, index }: { match: CityMatch; index: number }) {
  const { t } = useI18n();
  const { city } = match;
  const visaKnown = city.digitalNomadVisa === true || (city.visaLabel != null && city.visaLabel.length > 0);
  const hasRentData = city.housingLevel != null;

  const items: { title: string; detail: string }[] = [
    {
      title: t('report.verify.visa'),
      detail: visaKnown
        ? t('vc.visa.item', { country: cityCountryName(city), label: visaLabelText(city.visaLabel) })
        : t('vc.visa.itemNull', { country: cityCountryName(city) }),
    },
    {
      title: t('report.verify.rent'),
      detail: hasRentData
        ? t('vc.rent.item', { rent: String(city.housingLevel ?? '') })
        : t('report.verify.rent.none'),
    },
    {
      title: t('report.verify.net'),
      detail:
        city.internetMbps != null
          ? t('vc.net.item', { mbps: String(city.internetMbps) })
          : t('report.verify.net.none'),
    },
    {
      title: t('report.verify.detail'),
      detail: t('vc.visa.generic'),
    },
  ];

  return (
    <article className="card-paper p-6 md:p-7">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-ochre-deep">
          {String(index).padStart(2, '0')}
        </span>
        <h3 className="font-heading text-base font-semibold text-ink">
          {cityName(city)}
          <span className="ml-2 font-mono text-[10px] font-normal text-ink-soft">
            {cityCountryName(city)}
          </span>
        </h3>
      </div>
      <ul className="mt-4 space-y-3.5">
        {items.map((it) => (
          <li key={it.title} className="flex gap-3">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full border border-clay bg-clay/30" />
            <div>
              <p className="text-[13px] font-medium text-ink">{it.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-[1.8] text-ink-soft">{it.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
