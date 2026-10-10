// 第十一轮 i18n：报告「四层深度诊断」文案（游牧原型画像 / 雷区警示 / 加权梯队 / 现实账本）
// 与 mbti.ts（原型名/特质）配合使用：原型名与特质由 type.<CODE>.* 提供，此处只放结构性与规则性文案。
type Lang = 'zh' | 'en';

const zh: Record<string, string> = {
  // ---- 第一层：游牧生活形态原型 ----
  'rep.persona.eyebrow': 'layer 01 · 你的游牧生活形态原型',
  'rep.persona.title': '你的空间定居原型',
  'rep.persona.sub': '不是性格标签，而是「工作心理节律 × 空间能量需求」的决策画像',
  'rep.persona.traits': '核心特质',
  'rep.persona.rhythm': '工作心理节律与空间能量需求',

  // ---- 第二层：核心决策张力与雷区警示 ----
  'rep.deal.eyebrow': 'layer 02 · 核心决策张力与雷区警示',
  'rep.deal.title': '你的最佳赋能环境，与必须绕开的摩擦力',
  'rep.deal.best': '你的最佳赋能环境',
  'rep.deal.avoid': '你的致命摩擦力（Deal-breakers）',
  'rep.deal.avoidHint': '以下环境会持续消耗你的精神能量，选城时请优先规避：',

  // 雷区短语（由人格四轴与气候偏好规则生成）
  'rep.deal.party': '以狂欢社群（Party Nomad）著称的聚集地：高密度夜生活与陌生人社交会持续抽干你的专注力与独处回血时间。',
  'rep.deal.isolation': '过度沉寂的孤立小城：社区稀薄、几乎没有同频连接，长期会让你陷入能量枯竭。',
  'rep.deal.chaos': '高度不确定的混乱环境：规则模糊、基础配套不可预期，会不断消耗你确认现实的精力。',
  'rep.deal.boring': '一成不变的无趣之地：缺乏文化厚度与新刺激，会让你迅速失去停留的念头。',
  'rep.deal.drama': '人情纠缠、低效共识的环境：反复的情绪拉扯与和事佬文化，会拖垮你的决策效率。',
  'rep.deal.coldHeart': '冷漠功利的高压都市：缺乏善意与烟火气，再漂亮的账面也无法弥补精神上的异化感。',
  'rep.deal.rigid': '刻板拘谨、流程至上的环境：处处要预约、事事有硬性规矩，会磨掉你随机应变的自由。',
  'rep.deal.uncertainty': '高度随机、缺乏秩序的临时生态：租约、签证与日常安排都悬而未决，会让你持续焦虑。',
  'rep.deal.noSun': '阴雨连绵、日照稀缺的高纬寒冬：容易诱发季节性情绪低落，抵消城市的一切优点。',
  'rep.deal.hotHumid': '24 小时湿热黏腻的热带环境：出门两分钟即汗透，空调与蚊虫成为日常摩擦。',
  'rep.deal.costHigh': '生活成本远超预算的高消费枢纽：房租与短租溢价会迅速侵蚀你的储蓄与自由度。',

  // 赋能环境补充（与 an.env.* 的轴环境组合）
  'rep.enable.network': '高宽带、低抖动的稳定网络与成熟联合办公，是你心流时间的隐形地基。',
  'rep.enable.urban': '资源密度高、迁徙便利的都会——机场、国际社群与专业服务触手可及。',
  'rep.enable.nature': '推窗见山海的自然环境与大量户外可达性，是你恢复精力的开关。',

  // ---- 第三层：加权推荐梯队 ----
  'rep.tier.eyebrow': 'layer 03 · 加权推荐梯队',
  'rep.tier.title': '兼顾理性与意料之外的三档选择',
  'rep.tier.baseline.label': '基准天命之选',
  'rep.tier.baseline.desc': '各维度完美契合的主流之选，你的最优解。',
  'rep.tier.value.label': '高性价比备选',
  'rep.tier.value.desc': '满足核心条件，但月度开销显著更低——把省下的钱换成自由。',
  'rep.tier.surprise.label': '探索性惊喜之选',
  'rep.tier.surprise.desc': '平时未必留意，却由你的冷门偏好计算出的惊喜城市。',
  'rep.tier.save': '较基准每月约省 {usd}',
  'rep.tier.match': '契合度 {n}%',

  // ---- 第四层：现实落地账本 ----
  'rep.ledger.eyebrow': 'layer 04 · 现实落地账本',
  'rep.ledger.title': '基于你的画像，落地要花的钱与要踩的时间点',
  'rep.ledger.cost.title': '月度综合生活成本',
  'rep.ledger.cost.shareRoom': '单人合租',
  'rep.ledger.cost.solo': '舒适一居室',
  'rep.ledger.cost.avg': '综合月均',
  'rep.ledger.overlap.title': '黄金重叠办公时间',
  'rep.ledger.overlap.desc': '与核心协作方每个工作日可实时协同的小时数',
  'rep.ledger.overlap.beijing': '与北京（UTC+8）',
  'rep.ledger.overlap.london': '与伦敦（UTC+0/+1）',
  'rep.ledger.overlap.hours': '{h} 小时 / 工作日',
  'rep.ledger.visa.title': '签证与居留门槛',
  'rep.ledger.visa.dnYes': '设有数字游民签证，远程停留路径清晰',
  'rep.ledger.visa.dnNo': '暂无专门数字游民签证，需走常规居留路径',
  'rep.ledger.visa.pending': '居留政策待核实，出发前请以官方为准',
  'rep.ledger.tax.title': '税负概览',
};

const en: Record<string, string> = {
  // ---- Layer 1 ----
  'rep.persona.eyebrow': 'layer 01 · your nomad archetype',
  'rep.persona.title': 'Your Settlement Archetype',
  'rep.persona.sub': 'Not a personality label, but a decision profile of "work rhythm × spatial energy needs"',
  'rep.persona.traits': 'Core traits',
  'rep.persona.rhythm': 'Work rhythm & spatial energy needs',

  // ---- Layer 2 ----
  'rep.deal.eyebrow': 'layer 02 · decision tension & dealbreakers',
  'rep.deal.title': 'Your best-fit environment, and the friction you must avoid',
  'rep.deal.best': 'Your enabling environment',
  'rep.deal.avoid': 'Your deal-breakers',
  'rep.deal.avoidHint': 'These environments drain your energy — avoid them when choosing a city:',

  'rep.deal.party': 'Party-nomad hubs awash in nightlife and stranger-socializing, which steadily drain your focus and solitude.',
  'rep.deal.isolation': 'Dead-quiet, isolated towns with thin community — the lack of kindred connection leaves you depleted.',
  'rep.deal.chaos': 'Highly uncertain, chaotic settings where rules are vague and basics unpredictable, costing you energy to re-confirm reality.',
  'rep.deal.boring': 'Monotonous places with no cultural depth or new stimulus — you will lose the will to stay fast.',
  'rep.deal.drama': 'Drama-heavy, consensus-bound cultures where emotional entanglements and peacekeeping sap your decision speed.',
  'rep.deal.coldHeart': 'Cold, transactional metropolises — no amount of economic upside compensates for spiritual alienation.',
  'rep.deal.rigid': 'Rigid, procedure-first environments where everything needs a booking and a rule — it grinds down your adaptability.',
  'rep.deal.uncertainty': 'Highly random, order-poor scenes where leases, visas and daily plans all hang unresolved, keeping you anxious.',
  'rep.deal.noSun': 'Overcast, sun-starved high-latitude winters that invite seasonal lows and cancel out every other virtue.',
  'rep.deal.hotHumid': 'Around-the-clock humid heat — soaked two minutes outdoors, with air-con and insects as daily friction.',
  'rep.deal.costHigh': 'A high-cost hub far beyond your budget, where rent and short-let premiums erode savings and freedom.',

  'rep.enable.network': 'High-bandwidth, low-jitter connectivity and mature coworking — the hidden foundation of your flow time.',
  'rep.enable.urban': 'A dense, well-connected metropolis where airports, international communities and professional services are at hand.',
  'rep.enable.nature': 'Nature at the doorstep and generous outdoor access — the switch that restores your energy.',

  // ---- Layer 3 ----
  'rep.tier.eyebrow': 'layer 03 · weighted recommendation tiers',
  'rep.tier.title': 'Three tiers balancing reason and the unexpected',
  'rep.tier.baseline.label': 'The baseline pick',
  'rep.tier.baseline.desc': 'A mainstream city where every dimension aligns — your optimal answer.',
  'rep.tier.value.label': 'The high-value alternative',
  'rep.tier.value.desc': 'Meets the core conditions at a markedly lower monthly cost — turn savings into freedom.',
  'rep.tier.surprise.label': 'The exploratory surprise',
  'rep.tier.surprise.desc': 'Easy to overlook, yet surfaced by your niche preferences.',
  'rep.tier.save': '~{usd} cheaper per month than baseline',
  'rep.tier.match': '{n}% fit',

  // ---- Layer 4 ----
  'rep.ledger.eyebrow': 'layer 04 · reality ledger',
  'rep.ledger.title': 'What it costs and when to overlap, based on your profile',
  'rep.ledger.cost.title': 'Monthly living cost',
  'rep.ledger.cost.shareRoom': 'Shared room',
  'rep.ledger.cost.solo': 'Comfortable 1BR',
  'rep.ledger.cost.avg': 'All-in monthly',
  'rep.ledger.overlap.title': 'Golden overlap hours',
  'rep.ledger.overlap.desc': 'Real-time collaborating hours available each workday with your core team',
  'rep.ledger.overlap.beijing': 'With Beijing (UTC+8)',
  'rep.ledger.overlap.london': 'With London (UTC+0/+1)',
  'rep.ledger.overlap.hours': '{h} h / workday',
  'rep.ledger.visa.title': 'Visa & residency threshold',
  'rep.ledger.visa.dnYes': 'Has a digital-nomad visa — a clear remote-stay path',
  'rep.ledger.visa.dnNo': 'No dedicated digital-nomad visa; standard residency route required',
  'rep.ledger.visa.pending': 'Residency policy unverified — check official sources before departure',
  'rep.ledger.tax.title': 'Tax snapshot',
};

export const reportTiersDict: Record<Lang, Record<string, string>> = { zh, en };
