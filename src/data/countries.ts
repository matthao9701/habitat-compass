/**
 * countries.ts — 国家级参考数据（第六轮）
 * 参考/信息层：不进引擎加权，仅供报告页「国家概况」卡、对比页国家级行与
 * 城市详情弹层展示。数据来自 scripts/pipeline/fetch-country.mjs 产物。
 */
import rawCountries from './countries.json';
import type { Country } from './types';

export const COUNTRIES = rawCountries as unknown as Country[];

const BY_CODE = new Map<string, Country>(COUNTRIES.map((c) => [c.code, c]));

/** 按国家代码取国家概况；无数据返回 null */
export function getCountry(code: string | null | undefined): Country | null {
  if (!code) return null;
  return BY_CODE.get(code) ?? null;
}

/** 国家数据快照日期（全部国家同一批产出，取最大值展示） */
export function countriesUpdatedAt(): string {
  return COUNTRIES.reduce((acc, c) => (c.updatedAt > acc ? c.updatedAt : acc), COUNTRIES[0]?.updatedAt ?? '');
}
