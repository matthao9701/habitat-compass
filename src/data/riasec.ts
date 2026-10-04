/**
 * O*NET Interest Profiler Short Form（RIASEC 六维）——30 题精选
 * 来源：O*NET Resource Center「Interest Profiler Short Form」（Public Domain，美国劳工部赞助）
 * 口径：每维 5 题 × 5 点喜好量表（1=非常不喜欢 … 5=非常喜欢），维度分 5~25。
 * 题面：text 为中文题干；ref 为对应 O*NET 官方 activity 英文短语（en 模式渲染 ref）。
 * 详细来源与许可见 DATA.md 第九节。
 */

export type RiasecKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RiasecQuestion {
  id: string;
  dim: RiasecKey;
  /** 中文题干（「我喜欢…」句式） */
  text: string;
  /** O*NET 官方 activity 英文短语（公有领域，en 模式渲染） */
  ref: string;
}

/** RIASEC 喜好量表（5 点，与 O*NET IP 的 like/dislike 量表对齐） */
export const RIASEC_SCALE: { value: number; label: string }[] = [
  { value: 1, label: '非常不喜欢' },
  { value: 2, label: '不太喜欢' },
  { value: 3, label: '不确定' },
  { value: 4, label: '比较喜欢' },
  { value: 5, label: '非常喜欢' },
];

export const RIASEC_DIMS: RiasecKey[] = ['R', 'I', 'A', 'S', 'E', 'C'];

/** 每维题数（O*NET IP-SF 结构：6 维 × 5 题） */
export const RIASEC_PER_DIM = 5;

export const riasecQuestions: RiasecQuestion[] = [
  // ---- R 实际型（Realistic）：动手 · 机械 · 户外 ----
  { id: 'r1', dim: 'R', text: '我喜欢动手制作或修理物件（家具、电器、机械）', ref: 'Fix electrical things' },
  { id: 'r2', dim: 'R', text: '我喜欢组装或拆解设备，弄清它的构造', ref: 'Operate machinery and equipment' },
  { id: 'r3', dim: 'R', text: '我喜欢在户外劳作（种植、园艺、照看动植物）', ref: 'Grow vegetables or flowers' },
  { id: 'r4', dim: 'R', text: '我喜欢需要体力和手眼配合的活动（搭建、运动、修理车辆）', ref: 'Service and repair automobiles' },
  { id: 'r5', dim: 'R', text: '我喜欢亲手把图纸或想法做成实物', ref: 'Build kitchen cabinets' },
  // ---- I 研究型（Investigative）：分析 · 学术 · 求真 ----
  { id: 'i1', dim: 'I', text: '我喜欢做实验或系统性验证一个猜想', ref: 'Do laboratory tests to identify diseases' },
  { id: 'i2', dim: 'I', text: '我喜欢用数学或逻辑解决棘手问题', ref: 'Use math to solve problems' },
  { id: 'i3', dim: 'I', text: '我喜欢钻研一个主题直到彻底弄懂它', ref: 'Read scientific or technical journals' },
  { id: 'i4', dim: 'I', text: '我对自然或科学现象背后的原理感到好奇', ref: 'Study the structure of the human body' },
  { id: 'i5', dim: 'I', text: '我喜欢分析数据并从中找出规律', ref: 'Analyze data to find patterns' },
  // ---- A 艺术型（Artistic）：创作 · 审美 · 表达 ----
  { id: 'a1', dim: 'A', text: '我喜欢创作原创作品（绘画、设计、摄影）', ref: 'Create original artwork' },
  { id: 'a2', dim: 'A', text: '我喜欢写作（故事、随笔、剧本、文案）', ref: 'Write stories or scripts' },
  { id: 'a3', dim: 'A', text: '我喜欢演奏乐器或参与音乐活动', ref: 'Play a musical instrument' },
  { id: 'a4', dim: 'A', text: '我喜欢看或参与戏剧、电影、展览等艺术活动', ref: 'Act in a play' },
  { id: 'a5', dim: 'A', text: '我喜欢把日常生活环境布置得有美感', ref: 'Design interiors or displays' },
  // ---- S 社会型（Social）：社群 · 助人 · 教导 ----
  { id: 's1', dim: 'S', text: '我喜欢教别人东西或分享我的技能', ref: 'Teach or train others' },
  { id: 's2', dim: 'S', text: '我喜欢倾听并帮助别人解决困扰', ref: 'Help people with personal problems' },
  { id: 's3', dim: 'S', text: '我喜欢参加志愿服务或公益活动', ref: 'Volunteer for a community organization' },
  { id: 's4', dim: 'S', text: '我喜欢组织大家参与集体活动', ref: 'Organize activities for a group' },
  { id: 's5', dim: 'S', text: '我喜欢结识不同背景的新朋友并维系关系', ref: 'Meet new people from different backgrounds' },
  // ---- E 企业型（Enterprising）：领导 · 商业 · 冒险推进 ----
  { id: 'e1', dim: 'E', text: '我喜欢主导一个项目或团队往前推进', ref: 'Lead a team or project' },
  { id: 'e2', dim: 'E', text: '我喜欢销售产品、服务或说服他人接受想法', ref: 'Sell products or services' },
  { id: 'e3', dim: 'E', text: '我想过创办或运营自己的事业', ref: 'Start my own business' },
  { id: 'e4', dim: 'E', text: '我喜欢在公开场合发言或展示', ref: 'Give speeches or presentations' },
  { id: 'e5', dim: 'E', text: '我喜欢谈条件、争取资源或促成合作', ref: 'Negotiate prices or contracts' },
  // ---- C 常规型（Conventional）：条理 · 规律 · 结构化 ----
  { id: 'c1', dim: 'C', text: '我喜欢把记录、账目或文件整理得井井有条', ref: 'Keep detailed records or files' },
  { id: 'c2', dim: 'C', text: '我喜欢按既定流程和清单把事情做扎实', ref: 'Follow a set of procedures' },
  { id: 'c3', dim: 'C', text: '我喜欢规律作息和可预期的生活节奏', ref: 'Work according to a daily schedule' },
  { id: 'c4', dim: 'C', text: '我喜欢反复核对以确保准确无误', ref: 'Check work for accuracy' },
  { id: 'c5', dim: 'C', text: '我喜欢管理预算、记账或精打细算地规划开支', ref: 'Balance accounts or budgets' },
];
