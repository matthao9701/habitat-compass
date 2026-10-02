// 城市数据库类型定义

export type ClimateType =
  | 'tropical' // 热带
  | 'subtropical' // 亚热带
  | 'mediterranean' // 地中海
  | 'temperate' // 温带海洋性
  | 'continental' // 温带大陆
  | 'desert'; // 沙漠/干旱

export type Region = 'europe' | 'americas' | 'asia' | 'africa';

/**
 * MBTI 亲和向量：数值 -100 ~ 100，正方向分别为 E / N / F / P，
 * 表示该城市更契合的人格倾向。
 */
export interface CityTraitVector {
  ei: number;
  sn: number;
  tf: number;
  jp: number;
}

export interface City {
  id: string;
  nameZh: string;
  nameEn: string;
  countryZh: string;
  region: Region;
  /** 单个数字游民的月生活成本区间（USD） */
  cost: [number, number];
  /** 签证 / 居留灵活度 1-5 */
  visaScore: number;
  /** 签证政策快照（简体中文，一句话） */
  visaLabel: string;
  /** 网络质量 1-5（对应典型下行 12 / 25 / 45 / 75 / 110 Mbps） */
  internet: number;
  /** 安全指数 0-100（参考 Numbeo Safety Index） */
  safety: number;
  climate: ClimateType;
  /** 年均气温（摄氏度，约值） */
  tempC: number;
  /** 数字游民社区规模 1-5 */
  community: number;
  /** 英语友好度 1-5 */
  english: number;
  /** 生活节奏 1-5（1 慢，5 快） */
  pace: number;
  /** 城市规模 1-5（1 小镇，5 国际都会） */
  size: number;
  /** 生活方式标签（取自兴趣标签池） */
  tags: string[];
  traits: CityTraitVector;
}
