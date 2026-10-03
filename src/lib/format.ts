// 名称 / 金额 / 日期的本地化格式化（第七轮 i18n）
import { getCurrentLang, type Lang } from '../i18n';
import type { City, Country } from '../data/types';
import { CNY_USD_RATE } from './constraints';
import { cities } from '../data';

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
