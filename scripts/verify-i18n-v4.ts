/**
 * 第七轮 i18n 验证脚本（verify-i18n-v4）
 * 1) 语言包键完整性：zh/en 键集合完全一致
 * 2) 题目双语完整性：MBTI 32 / 偏好 8 / IPIP 120 / pro 偏好 20 / 兴趣 28+子项 / facets 30 / 16 型
 * 3) HTML lang 校验：index.html 默认 zh-CN + i18n 运行时同步逻辑存在
 * 4) translate 行为冒烟：en 命中 / vars 插值 / REVERSE_ZH 反查
 * 5) 城市与国家 nameEn 覆盖
 * 运行：pnpm tsx scripts/verify-i18n-v4.ts
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICTS, REVERSE_ZH } from '../src/i18n/dict/index';
import { questionsDict } from '../src/i18n/dict/questions';
import { mbtiDict } from '../src/i18n/dict/mbti';
import { interestsDict } from '../src/i18n/dict/interests';
import {
  mbtiQuestions,
  lifestyleQuestions,
} from '../src/data/questions';
import {
  ipipQuestions,
  proLifestyleQuestions,
  IPIP_FACETS,
} from '../src/data/questionsPro';
import { interestTags } from '../src/data/interests';
import {
  interestTagsPro,
  interestSubs,
} from '../src/data/interestsPro';
import { cities } from '../src/data/index';
import { COUNTRIES } from '../src/data/countries';
import { mbtiProfiles } from '../src/data/mbtiProfiles';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let pass = 0;
let fail = 0;
const fails: string[] = [];

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    const d = detail ? ` — ${detail}` : '';
    fails.push(label + d);
    console.log(`  ✗ ${label}${d}`);
  }
}

console.log('== [1] 语言包键完整性（zh/en 键集合一致） ==');
{
  const zhKeys = Object.keys(DICTS.zh);
  const enKeys = Object.keys(DICTS.en);
  const zhSet = new Set(zhKeys);
  const enSet = new Set(enKeys);
  const missingEn = zhKeys.filter((k) => !enSet.has(k));
  const missingZh = enKeys.filter((k) => !zhSet.has(k));
  ok(
    `zh/en 键集合一致（zh=${zhKeys.length}, en=${enKeys.length}）`,
    missingEn.length === 0 && missingZh.length === 0,
    missingEn.length ? `缺 en: ${missingEn.slice(0, 8).join(',')}` : missingZh.length ? `缺 zh: ${missingZh.slice(0, 8).join(',')}` : undefined,
  );
  // 空值检查（landing.hero.l2b 为英文语序下合法空串：l2a 已含 "you"）
  const EMPTY_OK = new Set(['landing.hero.l2b']);
  const emptyEn = enKeys.filter((k) => !EMPTY_OK.has(k) && !DICTS.en[k].trim());
  const emptyZh = zhKeys.filter((k) => !DICTS.zh[k].trim());
  ok('无空词条', emptyEn.length === 0 && emptyZh.length === 0, `${emptyEn.length + emptyZh.length} 个空值`);
  // REVERSE_ZH 重复 zh 值（同值多键会覆盖反查）
  const seen = new Map<string, string>();
  const dups: string[] = [];
  for (const [k, v] of Object.entries(DICTS.zh)) {
    if (seen.has(v)) dups.push(`${seen.get(v)} ↔ ${k} = "${v}"`);
    else seen.set(v, k);
  }
  if (dups.length > 0) {
    console.log(`  ⚠ REVERSE_ZH 重复 zh 值 ${dups.length} 个（同义键反查取后者，语义不变）: ${dups.slice(0, 3).join(' | ')}`);
  } else {
    console.log('  ✓ REVERSE_ZH 无重复 zh 值');
  }
}

console.log('== [2] 题目双语完整性 ==');
{
  // 2.1 MBTI 32 题
  const mbtiMiss: string[] = [];
  for (const q of mbtiQuestions) {
    for (const side of ['left', 'right'] as const) {
      for (const lang of ['zh', 'en'] as const) {
        const key = `mbti.${q.id}.${side}`;
        if (!questionsDict[lang][key]) mbtiMiss.push(`${lang}:${key}`);
      }
    }
  }
  ok(`MBTI 32 题 × left/right × zh/en 全覆盖（${mbtiQuestions.length * 4} 词条）`, mbtiQuestions.length === 32 && mbtiMiss.length === 0, mbtiMiss.slice(0, 5).join(','));

  // 2.2 简易版偏好 8 题
  const lsMiss: string[] = [];
  for (const q of lifestyleQuestions) {
    for (const lang of ['zh', 'en'] as const) {
      for (const suffix of ['title'] as const) {
        if (!questionsDict[lang][`ls.${q.id}.${suffix}`]) lsMiss.push(`ls.${q.id}.${suffix}`);
      }
      if (q.hint !== undefined && !questionsDict[lang][`ls.${q.id}.hint`]) lsMiss.push(`ls.${q.id}.hint`);
      for (const opt of q.options) {
        for (const suffix of ['label', 'desc'] as const) {
          if (!questionsDict[lang][`ls.${q.id}.opt.${opt.value}.${suffix}`]) lsMiss.push(`ls.${q.id}.opt.${opt.value}.${suffix}`);
        }
      }
    }
  }
  ok(`简易偏好 8 题词典全双语（title/hint/选项）`, lsMiss.length === 0, lsMiss.slice(0, 5).join(','));

  // 2.3 IPIP 120：ref 英文原句非空（en 模式渲染 ref，见 Quiz.tsx IPIPItem）
  const refShort = ipipQuestions.filter((q) => q.ref.trim().length < 4).length;
  const quizSrc = readFileSync(join(ROOT, 'src/components/Quiz.tsx'), 'utf-8');
  ok(`IPIP ${ipipQuestions.length} 题 ref 英文原句完整`, ipipQuestions.length === 120 && refShort === 0, `ref 过短 ${refShort}`);
  // 第八轮：RIASEC / 风险偏好双语键
  const r8Miss: string[] = [];
  for (const lang of ['zh', 'en'] as const) {
    for (const d of ['R', 'I', 'A', 'S', 'E', 'C']) {
      if (!DICTS[lang][`riasec.dim.${d}`]) r8Miss.push(`${lang}:riasec.dim.${d}`);
    }
    for (const combo of ['RA', 'RI', 'RS', 'RE', 'RC', 'IA', 'II', 'IS', 'IE', 'IC', 'AS', 'AE', 'AC', 'SE', 'SC', 'EC']) {
      for (const suffix of ['name', 'desc']) {
        if (!DICTS[lang][`riasec.combo.${combo}.${suffix}`]) r8Miss.push(`${lang}:riasec.combo.${combo}.${suffix}`);
      }
    }
    for (const k of ['riasec.section.title', 'riasec.lead', 'riasec.link', 'riasec.tagSep', 'risk.band.high', 'risk.band.mid.desc', 'risk.card.score']) {
      if (!DICTS[lang][k]) r8Miss.push(`${lang}:${k}`);
    }
    for (const i of [1, 2, 3, 4, 5]) if (!DICTS[lang][`quiz.riasec.${i}`]) r8Miss.push(`${lang}:quiz.riasec.${i}`);
  }
  ok('第八轮 RIASEC/风险键双语完整（dim/combo×16/量表档位/风险卡）', r8Miss.length === 0, r8Miss.slice(0, 4).join(', '));
  ok('IPIP 渲染层 en 模式使用 ref（lang === \'en\' ? question.ref）', quizSrc.includes("question.ref : question.text"));
  ok('IPIP 量表档位 quiz.ipip.1-5 双语', !!DICTS.en['quiz.ipip.1'] && !!DICTS.zh['quiz.ipip.5']);

  // 2.4 pro 偏好 20 题
  const proMiss: string[] = [];
  for (const q of proLifestyleQuestions) {
    for (const lang of ['zh', 'en'] as const) {
      if (!questionsDict[lang][`pro.${q.id}.title`]) proMiss.push(`pro.${q.id}.title`);
      const opts = (q as { options?: { value: string }[] }).options;
      if (opts) {
        for (const o of opts) {
          for (const suffix of ['label', 'desc'] as const) {
            if (!questionsDict[lang][`pro.${q.id}.opt.${o.value}.${suffix}`]) proMiss.push(`pro.${q.id}.opt.${o.value}.${suffix}`);
          }
        }
      }
    }
  }
  ok(`pro 偏好 ${proLifestyleQuestions.length} 题 title+选项双语`, proLifestyleQuestions.length === 20 && proMiss.length === 0, proMiss.slice(0, 5).join(','));

  // 2.5 兴趣标签（lite 16 + pro 28）与二级子项
  const tagMiss: string[] = [];
  for (const lang of ['zh', 'en'] as const) {
    for (const tag of interestTagsPro) {
      if (!interestsDict[lang][`tag.${tag.id}`]) tagMiss.push(`tag.${tag.id}`);
    }
    for (const tag of interestTags) {
      if (!interestsDict[lang][`tag.${tag.id}`]) tagMiss.push(`tag.${tag.id}`);
    }
  }
  const subIds = Object.values(interestSubs).flat().map((s) => s.id);
  const subMiss: string[] = [];
  for (const lang of ['zh', 'en'] as const) {
    for (const sid of subIds) {
      if (!interestsDict[lang][`sub.${sid}`]) subMiss.push(`sub.${sid}`);
    }
  }
  ok(`兴趣标签 ${interestTagsPro.length}（pro）+${interestTags.length}（lite）双语`, tagMiss.length === 0, tagMiss.slice(0, 5).join(','));
  ok(`兴趣二级子项 ${subIds.length} 双语`, subMiss.length === 0, subMiss.slice(0, 5).join(','));

  // 2.6 Big Five 30 facets
  const facMiss: string[] = [];
  for (const lang of ['zh', 'en'] as const) {
    for (const f of IPIP_FACETS) {
      if (!interestsDict[lang][`fac.${f.key}`]) facMiss.push(`fac.${f.key}`);
    }
  }
  ok(`Big Five ${IPIP_FACETS.length} facets 双语`, IPIP_FACETS.length === 30 && facMiss.length === 0, facMiss.slice(0, 5).join(','));

  // 2.7 16 型人格
  const typeCodes = Object.keys(mbtiProfiles);
  const typeMiss: string[] = [];
  for (const lang of ['zh', 'en'] as const) {
    for (const code of typeCodes) {
      for (const suffix of ['name', 'motto', 'desc', 'style'] as const) {
        if (!mbtiDict[lang][`type.${code}.${suffix}`]) typeMiss.push(`type.${code}.${suffix}`);
      }
    }
  }
  ok(`16 型 × name/motto/desc/style 双语`, typeCodes.length === 16 && typeMiss.length === 0, typeMiss.slice(0, 5).join(','));
}

console.log('== [3] HTML lang 同步 ==');
{
  const html = readFileSync(join(ROOT, 'index.html'), 'utf-8');
  ok('index.html 默认 lang="zh-CN"', /<html[^>]*lang="zh-CN"/.test(html));
  const descMatch = html.match(/<meta\s+name="description"[\s\S]*?content="([^"]*)"/);
  ok('index.html 静态 description 已更新（含栖居罗盘）', !!descMatch && descMatch[1].includes('栖居罗盘'));
  const i18nSrc = readFileSync(join(ROOT, 'src/i18n/index.tsx'), 'utf-8');
  ok('i18n 运行时含 documentElement.lang 同步', i18nSrc.includes('document.documentElement.lang'));
  ok('i18n 运行时同步 og:title/og:description', i18nSrc.includes('og:title') && i18nSrc.includes('og:description'));
  const lsSrc = readFileSync(join(ROOT, 'src/components/LangSwitch.tsx'), 'utf-8');
  ok('LangSwitch 语言切换组件存在', lsSrc.includes('setLang') || lsSrc.includes('useI18n'));
}

console.log('== [4] translate 行为冒烟（基于 DICTS/REVERSE_ZH 直接验证） ==');
{
  // en 命中
  const navCompare = DICTS.en['nav.compare'];
  ok(`en 词条命中（nav.compare → "${navCompare}"）`, typeof navCompare === 'string' && navCompare !== 'nav.compare' && navCompare.length > 0);
  // zh 命中
  ok('zh 词条命中', (DICTS.zh['nav.compare'] ?? '').length > 0);
  // vars 插值约定：词条内 {var} 占位
  const varKeys = Object.keys(DICTS.en).filter((k) => /\{[a-zA-Z]+\}/.test(DICTS.en[k]));
  ok(`插值占位词条存在（${varKeys.length} 个 {var} 词条）`, varKeys.length > 0);
  // REVERSE_ZH 反查：中文规则串 → key → en
  const sampleZh = Object.keys(REVERSE_ZH)[0];
  const sampleKey = REVERSE_ZH[sampleZh];
  ok(`REVERSE_ZH 反查可用（"${sampleZh}" → ${sampleKey} → en="${DICTS.en[sampleKey]}"）`, !!sampleKey && !!DICTS.en[sampleKey]);
  // analysis 规则层文案反查抽样：取 analysis.ts 中一个已知中文串
  const analysisSrc = readFileSync(join(ROOT, 'src/lib/analysis.ts'), 'utf-8');
  const zhStrs = [...analysisSrc.matchAll(/'([\u4e00-\u9fa5][^']{3,})'/g)].map((m) => m[1]);
  const covered = zhStrs.filter((s) => !!REVERSE_ZH[s]);
  ok(
    `analysis.ts 规则中文串可反查比例 ≥ 85%（${covered.length}/${zhStrs.length}）`,
    zhStrs.length > 0 && covered.length / zhStrs.length >= 0.85,
    zhStrs.filter((s) => !REVERSE_ZH[s]).slice(0, 4).join(' | '),
  );
}

console.log('== [5] 城市/国家 nameEn 覆盖 ==');
{
  const cityNoEn = cities.filter((c) => !c.nameEn || !c.nameEn.trim());
  ok(`城市 nameEn 全覆盖（${cities.length} 城，缺 ${cityNoEn.length}）`, cities.length >= 100 && cityNoEn.length === 0, cityNoEn.slice(0, 5).map((c) => c.nameZh).join(','));
  const countryNoEn = COUNTRIES.filter((c) => !c.nameEn || !c.nameEn.trim() && c.nameZh !== '台湾');
  ok(`国家 nameEn 覆盖 ≥ 64/65（${COUNTRIES.length} 国）`, COUNTRIES.length === 65 && countryNoEn.length <= 1, countryNoEn.map((c) => c.nameZh).join(','));
}

console.log('\n========================');
console.log(`verify-i18n-v4: ${pass} passed / ${fail} failed`);
if (fail > 0) {
  console.log('FAILED:');
  for (const f of fails) console.log('  - ' + f);
  process.exit(1);
}
