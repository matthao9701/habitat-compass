// 测评题目：MBTI 情境二选一 + 生活偏好

export type Pole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
export type Axis = 'EI' | 'SN' | 'TF' | 'JP';

export interface MBTIQuestion {
  id: string;
  axis: Axis;
  scenario: string;
  a: { text: string; pole: Pole };
  b: { text: string; pole: Pole };
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
// MBTI：每个维度 5 题，共 20 题
// ---------------------------------------------------------------------------

export const mbtiQuestions: MBTIQuestion[] = [
  // E / I
  {
    id: 'ei1',
    axis: 'EI',
    scenario: '抵达一座新城市的第一周，你更可能：',
    a: { text: '先去参加本地数字游民聚会，尽快认识一群人', pole: 'E' },
    b: { text: '独自摸清附近的咖啡馆、超市与路线，慢慢熟悉', pole: 'I' },
  },
  {
    id: 'ei2',
    axis: 'EI',
    scenario: '公寓楼下正好有一场热闹的街区派对，你会：',
    a: { text: '直接加入，享受不期而遇的热闹', pole: 'E' },
    b: { text: '戴上耳机在家看书，至多约一两个朋友小聚', pole: 'I' },
  },
  {
    id: 'ei3',
    axis: 'EI',
    scenario: '连续几天深度工作后，你恢复精力的方式是：',
    a: { text: '约人吃饭、参加活动，在交流中回血', pole: 'E' },
    b: { text: '独处、散步、看电影，安静地充电', pole: 'I' },
  },
  {
    id: 'ei4',
    axis: 'EI',
    scenario: '在联合办公空间里，你通常：',
    a: { text: '很快和周围人聊起来，还常组织午饭局', pole: 'E' },
    b: { text: '专注工作，只和熟悉的少数人寒暄', pole: 'I' },
  },
  {
    id: 'ei5',
    axis: 'EI',
    scenario: '安排一次周末短途旅行，你更倾向：',
    a: { text: '约上一群新朋友，热热闹闹地出发', pole: 'E' },
    b: { text: '自己或与一位密友，轻松安静地出行', pole: 'I' },
  },
  // S / N
  {
    id: 'sn1',
    axis: 'SN',
    scenario: '研究一座候选城市时，你更看重：',
    a: { text: '明确的数据：物价、交通、签证与成熟配套', pole: 'S' },
    b: { text: '城市的气质、可能性与想象空间', pole: 'N' },
  },
  {
    id: 'sn2',
    axis: 'SN',
    scenario: '周末探索城市，你喜欢：',
    a: { text: '按收藏清单打卡具体的店、市场和景点', pole: 'S' },
    b: { text: '无目的地漫游，在小巷里偶遇惊喜', pole: 'N' },
  },
  {
    id: 'sn3',
    axis: 'SN',
    scenario: '向朋友描述一个喜欢的地方，你会先讲：',
    a: { text: '天气、物价、网速这些实际细节', pole: 'S' },
    b: { text: '那里给人的感觉、气味与故事', pole: 'N' },
  },
  {
    id: 'sn4',
    axis: 'SN',
    scenario: '工作之余的空闲时间，你更愿意：',
    a: { text: '打磨可落地的技能，把日常流程理顺', pole: 'S' },
    b: { text: '构思新项目、新点子和未来的可能性', pole: 'N' },
  },
  {
    id: 'sn5',
    axis: 'SN',
    scenario: '面对一个完全陌生的环境，你的心态是：',
    a: { text: '依赖已验证的经验和信息，求稳', pole: 'S' },
    b: { text: '被未知吸引，越不确定越兴奋', pole: 'N' },
  },
  // T / F
  {
    id: 'tf1',
    axis: 'TF',
    scenario: '两座城市客观条件相近，让你最终拍板的是：',
    a: { text: '性价比、效率与长期收益的比较', pole: 'T' },
    b: { text: '哪里的人更友善、让你更有归属感', pole: 'F' },
  },
  {
    id: 'tf2',
    axis: 'TF',
    scenario: '朋友就迁居计划征求你的意见，你会先：',
    a: { text: '帮他分析预算、签证和风险点', pole: 'T' },
    b: { text: '理解他的感受和他真正想要的生活', pole: 'F' },
  },
  {
    id: 'tf3',
    axis: 'TF',
    scenario: '评价一个社区，你更在意：',
    a: { text: '规则清晰、运转高效、不内耗', pole: 'T' },
    b: { text: '氛围温暖、彼此关照、有人情味', pole: 'F' },
  },
  {
    id: 'tf4',
    axis: 'TF',
    scenario: '做重大决定时，你更倾向：',
    a: { text: '用数据和逻辑排除情绪干扰', pole: 'T' },
    b: { text: '权衡决定对自己和身边人的影响', pole: 'F' },
  },
  {
    id: 'tf5',
    axis: 'TF',
    scenario: '在异国遇到纠纷，你的第一反应是：',
    a: { text: '讲道理、查规则、维护自身权益', pole: 'T' },
    b: { text: '顾及对方处境，尽量温和地化解', pole: 'F' },
  },
  // J / P
  {
    id: 'jp1',
    axis: 'JP',
    scenario: '你的旅行风格更接近：',
    a: { text: '提前订好住宿与行程，按计划走', pole: 'J' },
    b: { text: '只定大方向，随兴留下或改道', pole: 'P' },
  },
  {
    id: 'jp2',
    axis: 'JP',
    scenario: '面对日常作息与待办事项，你：',
    a: { text: '有固定节奏和清单，完成才安心', pole: 'J' },
    b: { text: '灵活随性，灵感来了再冲刺', pole: 'P' },
  },
  {
    id: 'jp3',
    axis: 'JP',
    scenario: '选择签证与住宿时，你偏好：',
    a: { text: '手续明确、长期稳定的安排', pole: 'J' },
    b: { text: '灵活短租，随时可以变动', pole: 'P' },
  },
  {
    id: 'jp4',
    axis: 'JP',
    scenario: '你的周末计划通常是：',
    a: { text: '几天前就安排妥当', pole: 'J' },
    b: { text: '当天看心情再决定', pole: 'P' },
  },
  {
    id: 'jp5',
    axis: 'JP',
    scenario: '在一座城市停留多久，你倾向：',
    a: { text: '确定明确的租期、目标与截止时间', pole: 'J' },
    b: { text: '不设限，喜欢就继续待下去', pole: 'P' },
  },
];

// ---------------------------------------------------------------------------
// 生活偏好：8 题
// ---------------------------------------------------------------------------

export const lifestyleQuestions: LifestyleQuestion[] = [
  {
    id: 'budget',
    title: '你计划的月度生活预算区间是？',
    hint: '含房租、餐饮、交通与日常开销，不含大额一次性支出（USD）',
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
    title: '你最理想的气候是？',
    options: [
      { value: 'tropical', label: '热带海岛', desc: '常年盛夏，短裤拖鞋' },
      { value: 'mediterranean', label: '晴朗地中海', desc: '干爽阳光、四季温和' },
      { value: 'temperate', label: '四季分明', desc: '春夏秋冬各有风景' },
      { value: 'cool', label: '凉爽偏冷', desc: '怕热，需要冬天' },
      { value: 'any', label: '无所谓', desc: '气候不影响我的选择' },
    ],
  },
  {
    id: 'pace',
    title: '你期待的生活节奏是？',
    options: [
      { value: 'slow', label: '慢而悠闲', desc: '午休、散步、不赶时间' },
      { value: 'balanced', label: '张弛有度', desc: '高效工作，也认真生活' },
      { value: 'fast', label: '快节奏高能', desc: '机会密度与刺激感' },
    ],
  },
  {
    id: 'size',
    title: '你偏好的城市规模是？',
    options: [
      { value: 'small', label: '小镇 / 小城', desc: '步行可达、邻里相熟' },
      { value: 'mid', label: '中型城市', desc: '配套齐全又不压迫' },
      { value: 'metro', label: '国际大都市', desc: '地铁网络、24 小时灯火' },
    ],
  },
  {
    id: 'social',
    title: '你希望的社交活跃度是？',
    options: [
      { value: 'low', label: '低', desc: '独处为主，社交随缘' },
      { value: 'mid', label: '中', desc: '有固定小圈子，偶尔聚会' },
      { value: 'high', label: '高', desc: '经常活动，持续认识新朋友' },
    ],
  },
  {
    id: 'language',
    title: '你对语言障碍的顾虑程度？',
    options: [
      { value: 'high-english', label: '需要英语高度友好', desc: '办事、就医都希望能用英语' },
      { value: 'basic', label: '可以学基础当地语', desc: '日常打招呼没问题' },
      { value: 'no-barrier', label: '基本不介意', desc: '翻译软件加肢体语言足够' },
    ],
  },
  {
    id: 'visa',
    title: '你对签证 / 居留灵活性的需求？',
    options: [
      { value: 'high', label: '很高', desc: '免签、落地签或数字游民签证优先' },
      { value: 'mid', label: '中等', desc: '手续清晰即可接受' },
      { value: 'low', label: '较低', desc: '愿意为理想城市办理长期签证' },
    ],
  },
  {
    id: 'remote',
    title: '你对远程办公环境的要求？',
    options: [
      { value: 'high', label: '很高', desc: '稳定高速网络与成熟联合办公' },
      { value: 'mid', label: '中等', desc: '视频会议不卡即可' },
      { value: 'basic', label: '基础即可', desc: '能发消息、查资料就行' },
    ],
  },
];
