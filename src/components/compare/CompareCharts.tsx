// 对比页图表区：多城雷达 + 逐维条形 + 打分数值表（城市名可点开详情弹层）
import { useState } from 'react';
import { motion } from 'framer-motion';
import RadarChart from '../RadarChart';
import CityDetailModal from './CityDetailModal';
import { PREFERENCE_DIMENSIONS } from '../../lib/analysis';
import type { CompareRow } from '../../lib/compare';

const ease = [0.22, 1, 0.36, 1] as const;

const RADAR_AXES = ['居住成本', '网络', '安全', '社区', '英语', '签证'];

/** 雷达六维：与报告页 CityMatch.scores 同源同公式；null = 城市缺该维数据 */
function radarValues(row: CompareRow): (number | null)[] {
  const c = row.city;
  return [
    row.fitDetails.budget,
    c.internet != null ? c.internet * 20 : null,
    c.safety,
    c.community != null ? c.community * 20 : null,
    c.english != null ? c.english * 20 : null,
    c.visaScore != null ? c.visaScore * 20 : null,
  ];
}

export default function CompareCharts({ rows }: { rows: CompareRow[] }) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailRow = detailId != null ? rows.find((r) => r.city.id === detailId) ?? null : null;
  if (rows.length === 0) return null;

  // 任一轴缺数据的城市不进雷达（避免 0 值误导），仍在条形与数值表中以 — 展示
  const radarReady = rows.filter((r) => radarValues(r).every((v): v is number => v != null));
  const series = radarReady.map((r) => ({
    id: r.city.id,
    label: r.city.nameZh,
    color: r.color,
    values: radarValues(r) as number[],
  }));

  /** 逐维条形：人格 + 11 偏好 + 兴趣 */
  const dimRows: { label: string; valueOf: (r: CompareRow) => number | null }[] = [
    { label: '人格契合', valueOf: (r) => r.personalityFit },
    ...PREFERENCE_DIMENSIONS.map((d) => ({
      label: d.label,
      valueOf: (r: CompareRow) => r.fitDetails[d.key],
    })),
    { label: '兴趣重合', valueOf: (r) => r.interestFit },
  ];

  return (
    <section className="border-t hairline">
      <div className="mx-auto max-w-almanac px-6 py-12 md:px-10">
        <p className="eyebrow">chart 02 · 多城雷达</p>
        <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight md:text-[26px]">雷达与逐维对比</h2>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* 多城雷达 */}
          <div className="card-paper p-5 md:p-7">
            {series.length > 0 ? (
              <RadarChart axes={RADAR_AXES} series={series} size={320} />
            ) : (
              <p className="flex h-[320px] items-center justify-center text-center text-[12px] leading-[1.8] text-ink-soft">
                所选城市的雷达维度数据不全，暂不绘制雷达图——
                <br />
                完整数值见右侧逐维对比。
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
              {radarReady.map((r) => (
                <span key={r.city.id} className="flex items-center gap-1.5 font-mono text-[10.5px] text-ink-soft">
                  <span className="inline-block h-2 w-2 rounded-[2px]" style={{ backgroundColor: r.color }} />
                  {r.city.nameZh}
                </span>
              ))}
            </div>
            {radarReady.length < rows.length ? (
              <p className="mt-2 text-center font-mono text-[9.5px] text-ink-soft/70">
                注：数据不全的城市未计入雷达图
              </p>
            ) : null}
          </div>

          {/* 逐维条形 + 数值表 */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              {dimRows.map((dim, di) => (
                <motion.div
                  key={dim.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(di * 0.03, 0.2), ease }}
                >
                  <p className="mb-1 text-[11.5px] text-ink">{dim.label}</p>
                  <div className="flex flex-col gap-1">
                    {rows.map((r) => {
                      const v = dim.valueOf(r);
                      return (
                        <div key={r.city.id} className="flex items-center gap-2">
                          <span className="h-[7px] w-[7px] shrink-0 rounded-[2px]" style={{ backgroundColor: r.color }} />
                          {v != null ? (
                            <>
                              <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-ink/10">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: r.color }}
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${v}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 0.8, delay: Math.min(di * 0.03, 0.2), ease }}
                                />
                              </div>
                              <span className="w-7 shrink-0 text-right font-mono text-[10px] text-ink-soft">{v}</span>
                            </>
                          ) : (
                            <span className="flex-1 text-right font-mono text-[10px] text-ink-soft/70">— 无数据</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 维度数值表 */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-ink/15 text-left">
                    <th className="py-2 pr-3 font-medium text-ink-soft">维度</th>
                    {rows.map((r) => (
                      <th key={r.city.id} className="py-2 pr-3 text-right font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-[2px]" style={{ backgroundColor: r.color }} />
                          <button
                            type="button"
                            onClick={() => setDetailId(r.city.id)}
                            title={`查看 ${r.city.nameZh} 详情`}
                            className="text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:text-clay hover:decoration-clay/60"
                          >
                            {r.city.nameZh}
                          </button>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dimRows.map((dim) => (
                    <tr key={dim.label} className="border-b border-ink/[0.07]">
                      <td className="py-1.5 pr-3 text-ink-soft">{dim.label}</td>
                      {rows.map((r) => {
                        const v = dim.valueOf(r);
                        const tone = v == null ? 'text-ink-soft/60' : v >= 75 ? 'text-moss' : v >= 50 ? 'text-sea' : 'text-clay-deep';
                        return (
                          <td key={r.city.id} className={`py-1.5 pr-3 text-right ${tone}`}>
                            {v ?? '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <p className="mt-6 font-mono text-[9.5px] text-ink-soft/70">
          点击城市名可查看城市与所属国家的详细数据
        </p>
      </div>
      {detailRow ? <CityDetailModal row={detailRow} onClose={() => setDetailId(null)} /> : null}
    </section>
  );
}
