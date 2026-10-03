// 数据卡区：生活成本对比（真实字段计算 + 规则模板结论） + 公开数据对比表（仅列数据库实际字段）
import { useState } from 'react';
import { CLIMATE_LABEL } from '../../lib/engine';
import { compareCost, type CompareRow } from '../../lib/compare';

const fmt = (n: number): string => `$${n.toLocaleString('en-US')}`;

export default function CompareDataCards({ rows }: { rows: CompareRow[] }) {
  const [pair, setPair] = useState<[number, number]>([0, Math.min(1, 1)]);

  if (rows.length < 2) return null;

  // 城对选择索引防越界（城市增删后 pair 可能失效）
  const ai = Math.min(pair[0], rows.length - 1);
  const biRaw = pair[1] >= rows.length || pair[1] === pair[0] ? (ai + 1) % rows.length : pair[1];
  const bi = biRaw >= rows.length || biRaw === ai ? (ai + 1) % rows.length : biRaw;
  const costDiff = compareCost(rows[ai].city, rows[bi].city);

  /** 公开数据表：仅列城市数据库实际存在的字段（无医疗等字段，不编造） */
  const dataRows: { label: string; valueOf: (r: CompareRow) => string; toneOf?: (r: CompareRow) => string }[] = [
    { label: '气候类型', valueOf: (r) => CLIMATE_LABEL[r.city.climate] ?? r.city.climate },
    { label: '年均气温', valueOf: (r) => `${r.city.tempC}°C` },
    { label: '月均综合成本', valueOf: (r) => `~${fmt(r.city.monthlyCostUSD)}` },
    { label: '成本指数 · NYC=100', valueOf: (r) => `${r.city.costIndex}` },
    { label: '宽带中位', valueOf: (r) => `${r.city.internetMbps} Mbps` },
    { label: '安全指数', valueOf: (r) => `${r.city.safety}/100` },
    { label: '游民社区', valueOf: (r) => `${r.city.community}/5` },
    { label: '英语友好', valueOf: (r) => `${r.city.english}/5` },
    { label: '生活节奏', valueOf: (r) => `${r.city.pace}/5` },
    { label: '数字游民签证', valueOf: (r) => (r.city.digitalNomadVisa ? '有' : '—'), toneOf: (r) => (r.city.digitalNomadVisa ? 'text-moss' : 'text-ink-soft') },
  ];

  return (
    <section className="border-t hairline">
      <div className="mx-auto max-w-almanac px-6 py-12 md:px-10">
        <p className="eyebrow">chart 03 · 数据卡</p>
        <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight md:text-[26px]">成本与公开数据</h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* 生活成本对比卡 */}
          <div className="card-paper p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-[16px] font-bold">生活成本对比</h3>
              <div className="flex gap-2">
                {([0, 1] as const).map((slot) => (
                  <select
                    key={slot}
                    value={slot === 0 ? ai : bi}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPair(slot === 0 ? [v, bi === v ? ai : bi] : [ai, v === ai ? bi : v]);
                    }}
                    className="rounded-[6px] border border-ink/15 bg-paper px-2 py-1 font-mono text-[11px] text-ink outline-none focus:border-clay"
                    aria-label={slot === 0 ? '城市 A' : '城市 B'}
                  >
                    {rows.map((r, i) => (
                      <option key={r.city.id} value={i} disabled={slot === 0 ? i === bi : i === ai}>
                        {slot === 0 ? 'A · ' : 'B · '}
                        {r.city.nameZh}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-y hairline py-4 text-center">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">成本差</p>
                <p className="mt-1 font-mono text-[17px] text-ink">${Math.abs(costDiff.diffUSD).toLocaleString('en-US')}</p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">相对差</p>
                <p className="mt-1 font-mono text-[17px] text-ink">{costDiff.diffPct}%</p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">指数差</p>
                <p className="mt-1 font-mono text-[17px] text-ink">{Math.abs(costDiff.diffIndex)}</p>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-[1.8] text-ink-soft">{costDiff.conclusion}</p>
            <p className="mt-3 font-mono text-[9.5px] leading-relaxed text-ink-soft/70">
              口径：月均综合成本 = 市区一居室租金 + 水电网 + 餐饮 + 交通（USD，2026 年初估算，因生活方式而异）；成本指数为 Numbeo 口径（NYC=100）。
            </p>
          </div>

          {/* 公开数据对比表 */}
          <div className="card-paper p-5 md:p-7">
            <h3 className="font-heading text-[16px] font-bold">公开数据对比表</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse">
                <thead>
                  <tr className="border-b border-ink/15 text-left">
                    <th className="py-2 pr-3 font-mono text-[10px] font-medium uppercase tracking-eyebrow text-ink-soft">字段</th>
                    {rows.map((r) => (
                      <th key={r.city.id} className="py-2 pr-3 text-right font-mono text-[11px] font-medium text-ink">
                        {r.city.nameZh}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row) => (
                    <tr key={row.label} className="border-b border-ink/[0.07]">
                      <td className="py-1.5 pr-3 text-[12px] text-ink-soft">{row.label}</td>
                      {rows.map((r) => (
                        <td
                          key={r.city.id}
                          className={`py-1.5 pr-3 text-right font-mono text-[11.5px] ${row.toneOf ? row.toneOf(r) : 'text-ink'}`}
                        >
                          {row.valueOf(r)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 font-mono text-[9.5px] leading-relaxed text-ink-soft/70">
              仅列城市数据库实际字段；医疗质量等未入库字段不参与对比。签证政策为 2026 年初快照，出行前请以官方最新信息为准。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
