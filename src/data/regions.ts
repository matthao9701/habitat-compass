/**
 * 大洲与次区域展示标签（产品口径：UN M49 基础上的六洲划分，见 DATA.md）
 * continent 值与 City.region / City.continent 一致
 */

export const REGION_ORDER = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'] as const;

export type RegionLabel = (typeof REGION_ORDER)[number];

export const REGION_LABEL: Record<RegionLabel, string> = {
  europe: '欧洲',
  asia: '亚洲',
  africa: '非洲',
  'north-america': '北美洲',
  'south-america': '南美洲',
  oceania: '大洋洲',
};

export const SUBREGION_LABEL: Record<string, string> = {
  'southern-europe': '南欧',
  'western-europe': '西欧',
  'northern-europe': '北欧',
  'eastern-europe': '东欧',
  'eastern-asia': '东亚',
  'south-eastern-asia': '东南亚',
  'southern-asia': '南亚',
  'western-asia': '西亚',
  'central-asia': '中亚',
  'northern-africa': '北非',
  'western-africa': '西非',
  'eastern-africa': '东非',
  'southern-africa': '非洲南部',
  'northern-america': '北美',
  caribbean: '加勒比',
  'south-america': '南美',
  australasia: '澳新',
  melanesia: '美拉尼西亚',
};

export const subregionLabel = (key: string | null): string =>
  key != null ? (SUBREGION_LABEL[key] ?? key) : '—';
