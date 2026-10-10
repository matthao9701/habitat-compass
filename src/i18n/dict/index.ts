// 词典组装入口：把各域词典合并为 DICTS（zh/en 两套扁平键值表）
// - 键冲突时后合并者覆盖前者；各域键前缀不同（quiz. / report. / tag. / type. ...），无冲突
import { UI_DICT } from './ui';
import { ANALYSIS_DICT } from './analysis';
import { questionsDict } from './questions';
import { interestsDict } from './interests';
import { mbtiDict } from './mbti';
import { extraDict } from './extra';
import { reportTiersDict } from './reportTiers';

type Lang = 'zh' | 'en';

export const DICTS: Record<Lang, Record<string, string>> = {
  zh: {
    ...UI_DICT.zh,
    ...ANALYSIS_DICT.zh,
    ...questionsDict.zh,
    ...interestsDict.zh,
    ...mbtiDict.zh,
    ...extraDict.zh,
    ...reportTiersDict.zh,
  },
  en: {
    ...UI_DICT.en,
    ...ANALYSIS_DICT.en,
    ...questionsDict.en,
    ...interestsDict.en,
    ...mbtiDict.en,
    ...extraDict.en,
    ...reportTiersDict.en,
  },
};

/** 反向映射：中文文案 → 键。让规则层（analysis.ts 等）产出的中文串透传 t() 时自动按语言输出 */
export const REVERSE_ZH: Record<string, string> = (() => {
  const rev: Record<string, string> = {};
  for (const [key, value] of Object.entries(DICTS.zh)) {
    if (rev[value] == null) rev[value] = key;
  }
  return rev;
})();
