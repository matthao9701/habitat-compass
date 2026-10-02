// 测评题目：阶段一 MBTI 七级双极量表（OEJTS 结构）+ 阶段二 生活偏好情景选择题
//
// 题目来源与许可（IMPORTANT）：
// 阶段一题目结构基于 OEJTS 1.2（Open Extended Jungian Type Scales 1.2，
// Open Psychometrics 出品，https://openpsychometrics.org），原作许可
// CC BY-NC-SA 4.0。本文件在保留其双极特征对（bipolar item pairs）与
// 四维度（EI/SN/TF/JP）结构的基础上选取、改编并译为简体中文，
// 部分题目为按原结构补充的同型题目；本产品为非商业用途，署名共享。

export type Pole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
export type Axis = 'EI' | 'SN' | 'TF' | 'JP';

export const MBTI_SOURCE = {
  base: 'OEJTS 1.2 · Open Extended Jungian Type Scales',
  publisher: 'Open Psychometrics',
  license: 'CC BY-NC-SA 4.0',
  note: '题目依据 OEJTS 1.2 双极量表结构改编并译为简体中文（非商业用途）',
};

/** 七级双极量表题：value = 1 完全符合左特征，4 中立，7 完全符合右特征 */
export interface MBTIQuestion {
  id: string;
  axis: Axis;
  left: { text: string; pole: Pole };
  right: { text: string; pole: Pole };
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
// 阶段一 · MBTI：四维度各 8 题，共 32 题（页面内按 EI→SN→TF→JP 轮转交错排列）
// ---------------------------------------------------------------------------

export const mbtiQuestions: MBTIQuestion[] = [
  // ---- 第 1 轮：每维 1 题 ----
  { id: 'ei1', axis: 'EI', left: { text: '热闹的聚会让我越待越有劲', pole: 'E' }, right: { text: '安静的小圈子让我最自在', pole: 'I' } },
  { id: 'sn1', axis: 'SN', left: { text: '我更容易注意到具体的细节与事实', pole: 'S' }, right: { text: '我更容易联想到背后的模式与可能', pole: 'N' } },
  { id: 'tf1', axis: 'TF', left: { text: '做决定时，我先看逻辑和效率', pole: 'T' }, right: { text: '做决定时，我先看人的感受和价值', pole: 'F' } },
  { id: 'jp1', axis: 'JP', left: { text: '制定清单，按部就班', pole: 'J' }, right: { text: '依靠记忆，随遇而安', pole: 'P' } },
  // ---- 第 2 轮 ----
  { id: 'ei2', axis: 'EI', left: { text: '和陌生人也能很快聊开', pole: 'E' }, right: { text: '只在熟人面前才放得开', pole: 'I' } },
  { id: 'sn2', axis: 'SN', left: { text: '我先讲它让我联想到什么', pole: 'N' }, right: { text: '我先讲实际发生了什么', pole: 'S' } },
  { id: 'tf2', axis: 'TF', left: { text: '朋友倾诉烦恼，我先安慰和共情', pole: 'F' }, right: { text: '朋友倾诉烦恼，我先帮他分析问题', pole: 'T' } },
  { id: 'jp2', axis: 'JP', left: { text: '我的生活随兴致自然展开', pole: 'P' }, right: { text: '我的生活按日程表运转', pole: 'J' } },
  // ---- 第 3 轮 ----
  { id: 'ei3', axis: 'EI', left: { text: '想清楚了再说出口', pole: 'I' }, right: { text: '边说边想，越聊越清楚', pole: 'E' } },
  { id: 'sn3', axis: 'SN', left: { text: '我更信任验证过的经验', pole: 'S' }, right: { text: '我更信任自己的直觉', pole: 'N' } },
  { id: 'tf3', axis: 'TF', left: { text: '更糟糕的是冷漠无情', pole: 'F' }, right: { text: '更糟糕的是评判苛刻', pole: 'T' } },
  { id: 'jp3', axis: 'JP', left: { text: '出发前把住宿与行程订好', pole: 'J' }, right: { text: '只订大交通，其余随缘', pole: 'P' } },
  // ---- 第 4 轮 ----
  { id: 'ei4', axis: 'EI', left: { text: '工作之余总想约人一起', pole: 'E' }, right: { text: '工作之余只想一个人待着', pole: 'I' } },
  { id: 'sn4', axis: 'SN', left: { text: '学新东西，我从具体步骤入手', pole: 'S' }, right: { text: '学新东西，我先抓整体概念', pole: 'N' } },
  { id: 'tf4', axis: 'TF', left: { text: '先看方案是否合理', pole: 'T' }, right: { text: '先看它会如何影响人', pole: 'F' } },
  { id: 'jp4', axis: 'JP', left: { text: '截止日期前我会提前完成', pole: 'J' }, right: { text: '最后关头我的效率最高', pole: 'P' } },
  // ---- 第 5 轮 ----
  { id: 'ei5', axis: 'EI', left: { text: '长时间安静会让我憋得慌', pole: 'E' }, right: { text: '长时间热闹会让我累垮', pole: 'I' } },
  { id: 'sn5', axis: 'SN', left: { text: '忽略现实条件更让我惋惜', pole: 'S' }, right: { text: '错过新的可能性更让我惋惜', pole: 'N' } },
  { id: 'tf5', axis: 'TF', left: { text: '辩论时我更在意关系有没有受伤', pole: 'F' }, right: { text: '辩论时我更在意论点站不站得住', pole: 'T' } },
  { id: 'jp5', axis: 'JP', left: { text: '计划被打乱，我顺势换方案', pole: 'P' }, right: { text: '计划被打乱，我想尽快恢复秩序', pole: 'J' } },
  // ---- 第 6 轮 ----
  { id: 'ei6', axis: 'EI', left: { text: '在团队里我更多是倾听者', pole: 'I' }, right: { text: '在团队里我常是发起话题的人', pole: 'E' } },
  { id: 'sn6', axis: 'SN', left: { text: '看说明书，大概扫一眼就动手试', pole: 'N' }, right: { text: '看说明书，我逐条照做', pole: 'S' } },
  { id: 'tf6', axis: 'TF', left: { text: '朋友说我客观理性', pole: 'T' }, right: { text: '朋友说我温暖体贴', pole: 'F' } },
  { id: 'jp6', axis: 'JP', left: { text: '我更享受事情收尾完结的踏实', pole: 'J' }, right: { text: '我更享受保留多种可能的余地', pole: 'P' } },
  // ---- 第 7 轮 ----
  { id: 'ei7', axis: 'EI', left: { text: '周末喜欢呼朋唤友出门', pole: 'E' }, right: { text: '周末喜欢留给自己或一两个密友', pole: 'I' } },
  { id: 'sn7', axis: 'SN', left: { text: '我的念头大多关于当下的实际事务', pole: 'S' }, right: { text: '我的念头大多关于未来与关联', pole: 'N' } },
  { id: 'tf7', axis: 'TF', left: { text: '最打动我的是人物的情感与命运', pole: 'F' }, right: { text: '最打动我的是缜密的结构与逻辑', pole: 'T' } },
  { id: 'jp7', axis: 'JP', left: { text: '我的桌面有点乱，但自己找得到', pole: 'P' }, right: { text: '我的桌面整洁有序', pole: 'J' } },
  // ---- 第 8 轮 ----
  { id: 'ei8', axis: 'EI', left: { text: '朋友常说我沉静内敛', pole: 'I' }, right: { text: '朋友常说我热情外向', pole: 'E' } },
  { id: 'sn8', axis: 'SN', left: { text: '朋友说我天马行空', pole: 'N' }, right: { text: '朋友说我脚踏实地', pole: 'S' } },
  { id: 'tf8', axis: 'TF', left: { text: '夸人时我常夸能力强', pole: 'T' }, right: { text: '夸人时我常夸用心善良', pole: 'F' } },
  { id: 'jp8', axis: 'JP', left: { text: '要做的事尽早敲定', pole: 'J' }, right: { text: '要做的决定再等等看', pole: 'P' } },
];

// ---------------------------------------------------------------------------
// 阶段二 · 生活偏好：8 道情景选择题（选项 value 供匹配引擎使用，勿改）
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
