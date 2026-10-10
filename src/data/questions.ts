// 城市测评题库：核心段人格 SJT 情境迫选题 + 生活偏好情景选择题
//
// 题目来源与许可（IMPORTANT）：
// 核心段人格题库为原创 SJT（Situational Judgment Test）二元迫选场景题，
// 由本产品自研设计，无第三方量表许可依赖。场景扎根真实远程办公/旅居摩擦，
// A/B 选项在道德与体面感上中立对等，每轴 8 题共 32 题，映射 E/I · S/N · T/F · J/P 四轴。

export type Pole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
export type Axis = 'EI' | 'SN' | 'TF' | 'JP';

export const MBTI_SOURCE = {
  base: '原创 SJT 情境迫选题库',
  publisher: 'Habitat Compass',
  license: '本产品自研，无第三方量表许可依赖',
  note: '核心段人格题库为原创 SJT 二元迫选场景题，由本产品自研设计',
};

/** SJT 二元迫选场景题：a/b 两选项各指向一个极，用户二选一 */
export interface ScenarioQuestion {
  id: string;
  axis: Axis;
  a: { pole: Pole };
  b: { pole: Pole };
}

export interface LifestyleOption {
  value: string;
  label: string;
  desc?: string;
}

export interface LifestyleQuestion {
  id: string;
  title: string;
  hint?: string;
  options: LifestyleOption[];
}

// ---------------------------------------------------------------------------
// 核心段 · 人格：SJT 情境迫选题，四维度各 8 题，共 32 题
// 正向字母：EI 正向 = E；SN 正向 = N；TF 正向 = F；JP 正向 = P
// ---------------------------------------------------------------------------

export const scenarioQuestions: ScenarioQuestion[] = [
  // ---- EI 轴（正向 = E）：高强度远程周后如何回血 / 联合办公 vs 私人工位 / 初到新城社交 / 超长视频会后 / 跨时区协作姿态 / 房东临时变卦求助 / 独居孤独感应对 / 社交邀约取舍 ----
  { id: 'ei1', axis: 'EI', a: { pole: 'E' }, b: { pole: 'I' } },
  { id: 'ei2', axis: 'EI', a: { pole: 'E' }, b: { pole: 'I' } },
  { id: 'ei3', axis: 'EI', a: { pole: 'E' }, b: { pole: 'I' } },
  { id: 'ei4', axis: 'EI', a: { pole: 'E' }, b: { pole: 'I' } },
  { id: 'ei5', axis: 'EI', a: { pole: 'E' }, b: { pole: 'I' } },
  { id: 'ei6', axis: 'EI', a: { pole: 'E' }, b: { pole: 'I' } },
  { id: 'ei7', axis: 'EI', a: { pole: 'E' }, b: { pole: 'I' } },
  { id: 'ei8', axis: 'EI', a: { pole: 'E' }, b: { pole: 'I' } },
  // ---- SN 轴（正向 = N）：选城市先看什么 / 街区吸引力 / 行程计划方式 / 走在街上先注意什么 / 陌生街区问路 / 联合办公续费决策 / 选长期旅居城市 / 跨境收款工具 ----
  { id: 'sn1', axis: 'SN', a: { pole: 'N' }, b: { pole: 'S' } },
  { id: 'sn2', axis: 'SN', a: { pole: 'N' }, b: { pole: 'S' } },
  { id: 'sn3', axis: 'SN', a: { pole: 'N' }, b: { pole: 'S' } },
  { id: 'sn4', axis: 'SN', a: { pole: 'N' }, b: { pole: 'S' } },
  { id: 'sn5', axis: 'SN', a: { pole: 'N' }, b: { pole: 'S' } },
  { id: 'sn6', axis: 'SN', a: { pole: 'N' }, b: { pole: 'S' } },
  { id: 'sn7', axis: 'SN', a: { pole: 'N' }, b: { pole: 'S' } },
  { id: 'sn8', axis: 'SN', a: { pole: 'N' }, b: { pole: 'S' } },
  // ---- TF 轴（正向 = F）：冷漠高效城市能否长留 / 团体分歧裁决 / 复盘城市看什么 / 朋友倾诉时先做什么 / 预算超支反应 / 共享空间关闭应对 / 突发医疗第一反应 / 长期旅居回顾城市 ----
  { id: 'tf1', axis: 'TF', a: { pole: 'F' }, b: { pole: 'T' } },
  { id: 'tf2', axis: 'TF', a: { pole: 'F' }, b: { pole: 'T' } },
  { id: 'tf3', axis: 'TF', a: { pole: 'F' }, b: { pole: 'T' } },
  { id: 'tf4', axis: 'TF', a: { pole: 'F' }, b: { pole: 'T' } },
  { id: 'tf5', axis: 'TF', a: { pole: 'F' }, b: { pole: 'T' } },
  { id: 'tf6', axis: 'TF', a: { pole: 'F' }, b: { pole: 'T' } },
  { id: 'tf7', axis: 'TF', a: { pole: 'F' }, b: { pole: 'T' } },
  { id: 'tf8', axis: 'TF', a: { pole: 'F' }, b: { pole: 'T' } },
  // ---- JP 轴（正向 = P）：落地前准备程度 / 计划被打断反应 / 工作台与日程风格 / 截止日期习惯 / 签证窗口变化 / 打包行李方式 / 雨季困在室内 / 联合办公工位选择 ----
  { id: 'jp1', axis: 'JP', a: { pole: 'P' }, b: { pole: 'J' } },
  { id: 'jp2', axis: 'JP', a: { pole: 'P' }, b: { pole: 'J' } },
  { id: 'jp3', axis: 'JP', a: { pole: 'P' }, b: { pole: 'J' } },
  { id: 'jp4', axis: 'JP', a: { pole: 'P' }, b: { pole: 'J' } },
  { id: 'jp5', axis: 'JP', a: { pole: 'P' }, b: { pole: 'J' } },
  { id: 'jp6', axis: 'JP', a: { pole: 'P' }, b: { pole: 'J' } },
  { id: 'jp7', axis: 'JP', a: { pole: 'P' }, b: { pole: 'J' } },
  { id: 'jp8', axis: 'JP', a: { pole: 'P' }, b: { pole: 'J' } },
];

// ---------------------------------------------------------------------------
// 核心段 · 生活偏好：8 道情景选择题（选项 value 供匹配引擎使用，勿改）
// ---------------------------------------------------------------------------

export const lifestyleQuestions: LifestyleQuestion[] = [
  {
    id: 'budget',
    title: '账单时刻：一居室租金、水电网、餐饮与通勤加总——你的月度生活总预算大约是多少？',
    hint: '不含大额一次性支出（USD）',
    options: [
      { value: 'lt1000', label: '1,000 美元以内', desc: '极致性价比优先' },
      { value: '1000-1500', label: '1,000 – 1,500 美元', desc: '舒适但仍要精打细算' },
      { value: '1500-2500', label: '1,500 – 2,500 美元', desc: '东南亚宽裕、欧洲够用' },
      { value: '2500-4000', label: '2,500 – 4,000 美元', desc: '西欧主流城市无压力' },
      { value: 'gt4000', label: '4,000 美元以上', desc: '预算不再是主要约束' },
    ],
  },
  {
    id: 'climate',
    title: '清晨推开出租屋的窗，你希望迎面而来的是？',
    options: [
      { value: 'tropical', label: '热带海岛的湿暖海风', desc: '常年盛夏，短裤拖鞋' },
      { value: 'mediterranean', label: '地中海的干爽阳光', desc: '四季温和、晴天很多' },
      { value: 'temperate', label: '四季分明的凉风', desc: '春夏秋冬各有风景' },
      { value: 'cool', label: '偏冷地带的清冽空气', desc: '怕热，需要真正的冬天' },
      { value: 'any', label: '无所谓', desc: '气候不影响我的选择' },
    ],
  },
  {
    id: 'pace',
    title: '你理想中的一周，更接近哪幅画面？',
    options: [
      { value: 'slow', label: '午后才真正醒来的小城', desc: '午休、散步、不赶时间' },
      { value: 'balanced', label: '工作与生活各有节拍', desc: '高效工作，也认真生活' },
      { value: 'fast', label: '会议与活动连轴转', desc: '机会密度与刺激感' },
    ],
  },
  {
    id: 'size',
    title: '傍晚出门散步，你更想走进哪种街区？',
    options: [
      { value: 'small', label: '十分钟步行到田野的小城', desc: '步行可达、邻里相熟' },
      { value: 'mid', label: '咖啡馆与超市密集的中型城市', desc: '配套齐全又不压迫' },
      { value: 'metro', label: '地铁纵横、霓虹不熄的都会', desc: '国际大都市的资源密度' },
    ],
  },
  {
    id: 'social',
    title: '搬进新城市的第一个月，你理想中的社交状态是？',
    options: [
      { value: 'low', label: '独来独往，把城市泡熟', desc: '独处为主，社交随缘' },
      { value: 'mid', label: '认识三五熟人，偶尔小聚', desc: '有固定小圈子' },
      { value: 'high', label: '周周有局，持续认识新朋友', desc: '社交密度拉满' },
    ],
  },
  {
    id: 'language',
    title: '在一家只有当地语菜单的餐厅点菜，你的期望是？',
    options: [
      { value: 'high-english', label: '最好全程英语无障碍', desc: '办事、就医都希望能用英语' },
      { value: 'basic', label: '愿意学几句基本用语', desc: '日常打招呼没问题' },
      { value: 'no-barrier', label: '翻译软件加手势就够', desc: '基本不介意语言障碍' },
    ],
  },
  {
    id: 'visa',
    title: '研究签证政策时，哪句话最让你安心？',
    options: [
      { value: 'high', label: '「有现成的数字游民签证」', desc: '免签、落地签或游民签证优先' },
      { value: 'mid', label: '「材料清晰，流程顺畅」', desc: '手续明确即可接受' },
      { value: 'low', label: '「为理想城市折腾长签也值」', desc: '愿意为居留投入时间' },
    ],
  },
  {
    id: 'remote',
    title: '视频会议突然卡成幻灯片——你的底线是？',
    options: [
      { value: 'high', label: '完全不能忍', desc: '稳定高速网络与成熟联合办公' },
      { value: 'mid', label: '偶尔卡顿可以接受', desc: '视频会议不卡即可' },
      { value: 'basic', label: '能发消息查资料就行', desc: '基础网络即可' },
    ],
  },
];
