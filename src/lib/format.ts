// 名称 / 金额 / 日期的本地化格式化（第七轮 i18n）
import { getCurrentLang, translate, type Lang } from '../i18n';
import { ENTRY_NOTE_EN } from '../i18n/entryNotes';
import type { City, Country } from '../data/types';
import { CNY_USD_RATE } from './constraints';
import { cities } from '../data';
import { getCountry } from '../data/countries';

let CITY_INDEX: Map<string, City> | null = null;

function cityIndex(): Map<string, City> {
  if (!CITY_INDEX) {
    CITY_INDEX = new Map(cities.map((c) => [c.id, c]));
  }
  return CITY_INDEX;
}

/** 按 id 取城市（未命中返回 null） */
export function cityById(id: string): City | null {
  return cityIndex().get(id) ?? null;
}

/** 按 id 取城市名（城市库未命中时回退快照中文名） */
export function cityNameById(id: string, fallback: string): string {
  const c = cityById(id);
  return c ? cityName(c) : fallback;
}

/** 城市名：en 用英文名，zh 用中文名 */
export function cityName(city: City, lang?: Lang): string {
  const l = lang ?? getCurrentLang();
  return l === 'en' ? city.nameEn : city.nameZh;
}

/** 国家名：en 用英文名，zh 用中文名（Country 可空） */
export function countryName(country: Country | null | undefined, lang?: Lang): string {
  if (!country) return '—';
  const l = lang ?? getCurrentLang();
  return l === 'en' ? (country.nameEn ?? country.nameZh) : country.nameZh;
}

/** 城市内嵌国家名（City 自带 countryZh/countryEn；countryEn 缺失时按 countryCode 查 Country 快照补全） */
export function cityCountryName(city: City, lang?: Lang): string {
  const l = lang ?? getCurrentLang();
  if (l !== 'en') return city.countryZh;
  if (city.countryEn) return city.countryEn;
  return getCountry(city.countryCode)?.nameEn ?? city.countryZh;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * 金额本地化（口径：城市库成本以 USD 为事实源）。
 * - zh：主币种 CNY（按近似汇率 1 USD ≈ 7.2 CNY 折算取整），括注 USD 原值
 * - en：主币种 USD
 */
export function formatMoney(usd: number, lang?: Lang): string {
  const l = lang ?? getCurrentLang();
  if (l === 'zh') {
    return `¥${fmt(Math.round(usd * CNY_USD_RATE))}（≈$${fmt(usd)}）`;
  }
  return `$${fmt(usd)}`;
}

/** 金额按 locale 短格式（单一币种，无括注；用于卡片内紧凑的房租拆解等） */
export function formatMoneyShort(usd: number, lang?: Lang): string {
  const l = lang ?? getCurrentLang();
  if (l === 'zh') return `¥${fmt(Math.round(usd * CNY_USD_RATE))}`;
  return `$${fmt(Math.round(usd))}`;
}

/** 日期按 locale：zh 用 YYYY-MM-DD（数据快照习惯），en 用英文月日年 */
export function formatDate(iso: string, lang?: Lang): string {
  const l = lang ?? getCurrentLang();
  if (!iso) return '—';
  if (l === 'en') {
    const d = new Date(`${iso}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }
  return iso;
}

/**
 * 气候舒适简评本地化。
 * 数据层 summary 为中文确定性规则产物（见 scripts/pipeline/fetch-climate.mjs summarize），
 * 阈值固定：温度 14–24 温和 / <14 偏凉 / >24 偏热；降水 700/1300；日照 1800/2500。
 * en 下由数值重新拼英文，不依赖数据层中文串；zh 直接回原文，保持与既有数据一致。
 */
export function climateSummary(
  detail: { avgTempC: number; annualPrecipMm: number; sunshineHours: number; summary: string } | null,
  lang?: Lang,
): string | null {
  if (!detail) return null;
  const l = lang ?? getCurrentLang();
  if (l !== 'en') return detail.summary;
  const tt = detail.avgTempC >= 14 && detail.avgTempC <= 24 ? 'climate.t.mild' : detail.avgTempC < 14 ? 'climate.t.cool' : 'climate.t.hot';
  const pp = detail.annualPrecipMm <= 700 ? 'climate.p.low' : detail.annualPrecipMm <= 1300 ? 'climate.p.mid' : 'climate.p.high';
  const ss = detail.sunshineHours >= 2500 ? 'climate.s.high' : detail.sunshineHours >= 1800 ? 'climate.s.mid' : 'climate.s.low';
  return `${translate(l, tt)}, ${translate(l, pp)}, ${translate(l, ss)}`;
}

/** 城市兴趣标签本地化（词典键约定 tag.<name>）；未登记键回落原值 */
export function tagLabel(tag: string, lang?: Lang): string {
  return translate(lang ?? getCurrentLang(), `tag.${tag}`);
}

/** 英语环境评级本地化（词典键 band.english.<band>） */
export function englishBandLabel(band: string | null | undefined, lang?: Lang): string {
  if (!band) return '—';
  return translate(lang ?? getCurrentLang(), `band.english.${band}`);
}

/** 次区域标签本地化（词典键 subregion.<key>）；未登记键回落原值 */
export function subregionName(key: string | null | undefined, lang?: Lang): string {
  if (!key) return '—';
  return translate(lang ?? getCurrentLang(), `subregion.${key}`);
}

/** 偏好维度标签本地化（词典键 dim.<key>） */
export function dimensionLabel(key: string, lang?: Lang): string {
  return translate(lang ?? getCurrentLang(), `dim.${key}`);
}

/**
 * 用户画像标签本地化（档案标签来自 engine.buildProfileTags，为中文原文）：
 * - 16 型代码（如 INTJ）→ 词典键 type.<CODE>.name
 * - 其余为生活方式选项 / 兴趣标签的中文原文 → 反查词典（REVERSE_ZH）输出对应语言
 */
export function profileTagLabel(tag: string, lang?: Lang): string {
  const l = lang ?? getCurrentLang();
  if (/^[EI][NS][TF][JP]$/.test(tag)) return translate(l, `type.${tag}.name`);
  return translate(l, tag);
}

/** 护照入境备注本地化：数据层为简体中文快照，en 查静态译表，未命中回落原文 */
export function entryNote(note: string | null | undefined, lang?: Lang): string {
  if (!note) return '—';
  const l = lang ?? getCurrentLang();
  if (l !== 'en') return note;
  return ENTRY_NOTE_EN[note] ?? note;
}
