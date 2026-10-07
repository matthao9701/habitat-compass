// 16 型 MBTI 代号与校验。
//
// 历史沿革：此文件原为 `Record<string, MBTIProfile>`，内含每型的 name / motto / desc /
// nomadStyle / envTags。但这些字段在 `src/i18n/dict/mbti.ts`（mbtiDict）里都有等价且
// 双语（zh/en）的版本，渲染一律走 `t('type.<CODE>.xxx')`，此文件的文本字段从未被读取——
// 且曾出现两处副本漂移（如 ENFP desc 的「厌恶 routine」漏译）。故只保留代号与校验，
// 文本唯一事实源为 mbtiDict。

/** 16 型代号（E/I × S/N × T/F × J/P 的全部组合） */
export const MBTI_TYPE_CODES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;

export type MbtiTypeCode = (typeof MBTI_TYPE_CODES)[number];

const CODE_SET: ReadonlySet<string> = new Set(MBTI_TYPE_CODES);

/** 是否为合法的 16 型代号（引擎产出的 typeCode 理论上恒为真，此处作渲染前的防御性校验） */
export function isMbtiTypeCode(code: string): code is MbtiTypeCode {
  return CODE_SET.has(code);
}
