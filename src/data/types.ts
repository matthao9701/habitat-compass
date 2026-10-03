// 城市数据库类型定义（v2：100 城 / 六大洲 / 数据维度扩充）

export type ClimateType =
  | 'tropical' // 热带
  | 'subtropical' // 亚热带
  | 'mediterranean' // 地中海
  | 'temperate' // 温带海洋性
  | 'continental' // 温带大陆
  | 'desert'; // 沙漠/干旱

/** 大洲（GeoNames 官方大洲代码口径，不含南极） */
export type Region = 'europe' | 'asia' | 'africa' | 'north-america' | 'south-america' | 'oceania';

/** 数字游民签证状态三档；null = 无可靠来源，未核实（界面隐藏） */
export type VisaStatus = 'official' | 'alternative' | 'none' | null;

/** EF EPI 英语普及度官方评级（国别年度报告，引用口径） */
export type EpiBand = 'very high' | 'high' | 'moderate' | 'low' | 'very low';

/**
 * MBTI 亲和向量：数值 -100 ~ 100，正方向分别为 E / N / F / P，
 * 表示该城市更契合的人格倾向。null = 未标注（引擎人格维度降权，不编造）。
 */
export interface CityTraitVector {
  ei: number;
  sn: number;
  tf: number;
  jp: number;
}

/** Open-Meteo Historical Weather API 聚合产物（2015-2024 十年均值，CC BY 4.0） */
export interface CityClimateDetail {
  avgTempC: number;
  annualPrecipMm: number;
  precipDays: number;
  sunshineHours: number;
  /** 气候舒适简评（确定性规则生成） */
  summary: string;
}

/** 数字游民签证结构化详情；数字字段无可靠来源时 null */
export interface CityVisaDetail {
  /** 签证 / 政策名称（真实来源原文或既有政策快照） */
  name: string | null;
  /** 政策要点原文（简体中文快照，来自既有核实文案） */
  note: string;
  maxStayMonths: number | null;
  minIncomeUSD: number | null;
  feeUSD: number | null;
  taxNote: string | null;
}

export interface City {
  id: string;
  nameZh: string;
  nameEn: string;
  countryZh: string;
  countryEn: string;
  region: Region;
  /** UN M49 口径次区域（如 南欧 / 东南亚 / 东非） */
  subregion: string;
  lat: number;
  lng: number;
  /** 人口（GeoNames cities15000，CC BY 4.0） */
  population: number | null;
  /** IANA 时区（GeoNames tz 列） */
  timezone: string | null;

  // ---- 成本 ----
  /** 单个数字游民的月生活成本区间（USD）；无来源 null */
  cost: [number, number] | null;
  /** 月均综合生活成本（USD，含市区一居室租金；Numbeo 口径估算） */
  monthlyCostUSD: number | null;
  /** 生活成本指数（Numbeo Cost of Living Plus Rent Index，NYC = 100） */
  costIndex: number | null;
  /** 市中心一居室月租（USD，Numbeo 详情页转录） */
  rent1brUSD: number | null;
  /** 普通餐厅一顿（USD，Numbeo 详情页转录） */
  mealUSD: number | null;

  // ---- 指数（Numbeo Quality of Life rankings，NYC = 100）----
  /** 安全指数（既有字段；v2 由 Numbeo Safety Index 补全/校准） */
  safety: number | null;
  healthcareIndex: number | null;
  pollutionIndex: number | null;
  trafficIndex: number | null;
  purchasingPowerIndex: number | null;
  climateIndex: number | null;

  // ---- 气候 ----
  /** 气候类型（第一轮人工核实字段；新城无可靠判定来源为 null） */
  climate: ClimateType | null;
  /** 年均气温（摄氏度；39 城为约值，新城来自 Open-Meteo 精确值） */
  tempC: number | null;
  /** Open-Meteo 十年聚合气候明细 */
  climateDetail: CityClimateDetail | null;

  // ---- 引擎序数输入（1-5；无可靠来源 null，引擎自动降权）----
  visaScore: number | null;
  visaLabel: string | null;
  internet: number | null;
  internetMbps: number | null;
  community: number | null;
  english: number | null;
  pace: number | null;
  size: number | null;

  // ---- 数字游民 ----
  digitalNomadVisa: boolean | null;
  visaStatus: VisaStatus;
  visaDetail: CityVisaDetail | null;
  englishEpiBand: EpiBand | null;
  englishEpiScore: number | null;

  // ---- 兴趣与人格 ----
  /** 生活方式标签（取自兴趣标签池；空数组 = 无标注，兴趣维度降权） */
  tags: string[];
  traits: CityTraitVector | null;
}
