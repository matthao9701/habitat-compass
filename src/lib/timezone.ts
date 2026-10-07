// 时区「工作时段重叠」直觉化：把 IANA 时区换算成与参照城市的可协作小时数。
// 口径：以 9:00–18:00（9 小时）为标准工作窗口，重叠 = clamp(9 - |时差|, 0, 9)。
// 例：里斯本（UTC+1）与北京（UTC+8）差 7 小时 → 重叠 2 小时；与伦敦差 0 → 重叠 9 小时。
// 依赖 Intl（浏览器与 Node 均原生支持），不引入额外依赖；取「当前时刻」的偏移，自动含夏令时。

/** 参照城市（数据层 IANA 时区）：伦敦 / 北京 */
export const REF_TZ = {
  london: 'Europe/London',
  beijing: 'Asia/Shanghai',
} as const;

export type RefCity = keyof typeof REF_TZ;

/** 标准工作窗口长度（小时） */
const WORK_WINDOW_HOURS = 9;

/** 某 IANA 时区在给定时刻相对 UTC 的偏移（分钟）；无效时区返回 null */
function offsetMinutes(tz: string, at: Date): number | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts: Record<string, string> = {};
    for (const p of fmt.formatToParts(at)) parts[p.type] = p.value;
    const asUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second),
    );
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch {
    return null;
  }
}

/**
 * 城市与参照城市的「工作时段重叠小时数」（0–9）。
 * @param tz 城市 IANA 时区；null/非法返回 null（界面回退为不展示）
 * @param ref 参照城市（london / beijing）
 * @param at 参照时刻（默认当前；构建期静态生成可传入固定日期）
 */
export function overlapHours(tz: string | null | undefined, ref: RefCity, at: Date = new Date()): number | null {
  if (!tz) return null;
  const a = offsetMinutes(tz, at);
  const b = offsetMinutes(REF_TZ[ref], at);
  if (a == null || b == null) return null;
  const diffHours = Math.abs(a - b) / 60;
  return Math.max(0, Math.min(WORK_WINDOW_HOURS, Math.round(WORK_WINDOW_HOURS - diffHours)));
}
