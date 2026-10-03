import type { CityMatch } from '../../lib/engine';

/**
 * VerificationChecklist — 报告页「搬家前待核实清单」模块（第六轮）
 * 针对 Top 推荐城市逐项列出需要线下核实的事项；查不到官方链接的统一标注
 * 「请自行搜索官方来源」，本站不代拟任何政策 URL。
 */
export default function VerificationChecklist({ matches }: { matches: CityMatch[] }) {
  const top = matches.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section className="border-y hairline bg-paper-deep/50">
      <div className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-20">
        <p className="eyebrow mb-3">before you move</p>
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
          搬家前待核实清单
        </h2>
        <p className="mb-10 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
          本站所有数据来自公开渠道快照，存在时效性。签约与出发之前，请针对每座候选城市完成以下核实动作。
        </p>

        <div className="space-y-5">
          {top.map((m, i) => (
            <ChecklistCard key={m.city.id} match={m} index={i + 1} />
          ))}
        </div>

        <p className="mt-8 border-t hairline pt-5 font-mono text-[10px] leading-[1.9] text-ink-soft">
          免责声明 · 本报告数据来自公开渠道，存在时效性；签证、税务、法律事项请以官方来源为准，本站不提供专业建议。
        </p>
      </div>
    </section>
  );
}

function ChecklistCard({ match, index }: { match: CityMatch; index: number }) {
  const { city } = match;
  const visaKnown = city.digitalNomadVisa === true || (city.visaLabel != null && city.visaLabel.length > 0);
  const hasRentData = city.rent1brUSD != null;

  const items: { title: string; detail: string }[] = [
    {
      title: '签证与居留政策',
      detail: visaKnown
        ? `${city.countryZh}：${city.visaLabel}——请前往该国移民局 / 外交部官方网站核实最新申请条件、停留时长与收入门槛（本站不提供官方链接，请自行搜索官方来源，认准 gov / 官方移民局域名）。`
        : `${city.countryZh}：城市库暂无结构化签证信息，请自行搜索官方来源（移民局 / 外交部官方网站），并留意数字游民签证与旅游签证停留上限的区别。`,
    },
    {
      title: '房租实价',
      detail: hasRentData
        ? `城市库估值为市区一居 $${city.rent1brUSD}/月——请在 Booking 长租、Local 房产平台与本地租房群交叉核实真实挂牌价，旺季与淡季差异可能超过 30%。`
        : '城市库暂无租金估算——请在长租平台与本地渠道交叉核实，并确认是否含水电网络与押金规则。',
    },
    {
      title: '网络实测',
      detail:
        city.internetMbps != null
          ? `宽带中位约 ${city.internetMbps} Mbps——实际体验因楼宇与运营商差异极大，建议先短住一周实测（Speedtest 多时段、不同位置各测一次），并确认备用网络（eSIM / 手机热点）。`
          : '城市库暂无宽带数据——务必先短住实测多时段网速，并准备 eSIM 或手机热点作为备用网络。',
    },
    {
      title: '签证明细核对',
      detail: `若该国有数字游民签证，收入门槛、保险要求、税务居民身份认定与续签规则请逐条与官方核对；本站的签证快照仅作初筛，不构成任何法律依据。`,
    },
  ];

  return (
    <article className="card-paper p-6 md:p-7">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-ochre">
          {String(index).padStart(2, '0')}
        </span>
        <h3 className="font-heading text-base font-bold text-ink">
          {city.nameZh}
          <span className="ml-2 font-mono text-[10px] font-normal text-ink-soft">
            {city.countryZh}
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
