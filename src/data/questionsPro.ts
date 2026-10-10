// 标准版题库 · 阶段一：IPIP-NEO 120 题人格量表（30 facets × 4 题，5 点自陈量表）
//
// 来源与许可（IMPORTANT）：
// - 题目条目参照 IPIP 国际人格项目池（ipip.ori.org，Goldberg, 1999）公有领域条目
//   汉化改编，量表结构对齐 IPIP-NEO-120（Johnson, 2014，公有领域）：
//   30 facets × 4 题、每 facet 正向计分（+keyed）与反向计分（-keyed）各半。
// - IPIP-NEO-120 与 IPIP 条目池均为公有领域（public domain），可自由使用与改编。
// - 每题 ref 字段保留英文参照句，便于溯源核对。
// - 计分：+keyed 得分 = 原始值；-keyed 得分 = 6 - 原始值（1-5 量表）。
//   facet 分 = 4 题均值 → 域分 = 6 facet 均值 → 百分位 = (score - 1) / 4 * 100。
// - 深度测验已改用同一批条目的「二元迫选」配对（ipipPairs，见下），
//   上面 120 题自陈量表作为配对来源与溯源保留。

export type BigFiveDomain = 'E' | 'A' | 'C' | 'N' | 'O';

export const DOMAIN_LABEL: Record<BigFiveDomain, string> = {
  E: '外向性 Extraversion',
  A: '宜人性 Agreeableness',
  C: '尽责性 Conscientiousness',
  N: '神经质 Neuroticism',
  O: '开放性 Openness',
};

export const DOMAIN_SHORT: Record<BigFiveDomain, string> = {
  E: '外向性',
  A: '宜人性',
  C: '尽责性',
  N: '神经质',
  O: '开放性',
};

/** IPIP 官方 5 点计分量表（Johnson 2014 版标签） */
export const IPIP_SCALE = [
  { value: 1, label: '非常不准确' },
  { value: 2, label: '较不准确' },
  { value: 3, label: '不确定' },
  { value: 4, label: '较准确' },
  { value: 5, label: '非常准确' },
] as const;

export interface IpipQuestion {
  id: string;
  domain: BigFiveDomain;
  facet: string;
  facetZh: string;
  /** 1 = 正向计分（+keyed），-1 = 反向计分（-keyed） */
  keyed: 1 | -1;
  text: string;
  ref: string;
}

export const ipipQuestions: IpipQuestion[] = [
  // ================= N · 神经质 =================
  // facet 1 焦虑 Anxiety
  { id: 'anxiety-1', domain: 'N', facet: 'anxiety', facetZh: '焦虑', keyed: 1, text: '我常为各种事情担忧', ref: 'Worry about things' },
  { id: 'anxiety-2', domain: 'N', facet: 'anxiety', facetZh: '焦虑', keyed: 1, text: '我很容易被压力压垮', ref: 'Get stressed out easily' },
  { id: 'anxiety-3', domain: 'N', facet: 'anxiety', facetZh: '焦虑', keyed: -1, text: '大多数时候我都轻松自在', ref: 'Am relaxed most of the time' },
  { id: 'anxiety-4', domain: 'N', facet: 'anxiety', facetZh: '焦虑', keyed: -1, text: '就算出了状况，我也不太会慌', ref: 'Am not easily bothered by things' },
  // facet 2 愤怒 Anger
  { id: 'anger-1', domain: 'N', facet: 'anger', facetZh: '易怒', keyed: 1, text: '我很容易发火', ref: 'Get angry easily' },
  { id: 'anger-2', domain: 'N', facet: 'anger', facetZh: '易怒', keyed: 1, text: '我会为小事发脾气', ref: 'Lose my temper' },
  { id: 'anger-3', domain: 'N', facet: 'anger', facetZh: '易怒', keyed: -1, text: '我很少被人惹恼', ref: 'Am not easily annoyed' },
  { id: 'anger-4', domain: 'N', facet: 'anger', facetZh: '易怒', keyed: -1, text: '我能很好地控制自己的情绪', ref: 'Keep my emotions under control' },
  // facet 3 抑郁 Depression
  { id: 'depression-1', domain: 'N', facet: 'depression', facetZh: '低落', keyed: 1, text: '我经常情绪低落', ref: 'Often feel blue' },
  { id: 'depression-2', domain: 'N', facet: 'depression', facetZh: '低落', keyed: 1, text: '我对自己不太满意', ref: 'Dislike myself' },
  { id: 'depression-3', domain: 'N', facet: 'depression', facetZh: '低落', keyed: -1, text: '我很少感到消沉', ref: 'Am seldom in a bad mood' },
  { id: 'depression-4', domain: 'N', facet: 'depression', facetZh: '低落', keyed: -1, text: '我对自己的现状大体满意', ref: 'Feel comfortable with myself' },
  // facet 4 社交敏感 Self-Consciousness
  { id: 'selfconscious-1', domain: 'N', facet: 'selfConsciousness', facetZh: '社交敏感', keyed: 1, text: '我很在意别人对我的看法', ref: 'Worry about what others think of me' },
  { id: 'selfconscious-2', domain: 'N', facet: 'selfConsciousness', facetZh: '社交敏感', keyed: 1, text: '我怕成为众人关注的焦点', ref: 'Am afraid to draw attention to myself' },
  { id: 'selfconscious-3', domain: 'N', facet: 'selfConsciousness', facetZh: '社交敏感', keyed: -1, text: '我不容易感到难为情', ref: 'Am not embarrassed easily' },
  { id: 'selfconscious-4', domain: 'N', facet: 'selfConsciousness', facetZh: '社交敏感', keyed: -1, text: '别人怎么评价我，我不太放在心上', ref: 'Am not bothered by others’ opinions' },
  // facet 5 冲动 Immoderation
  { id: 'immoderation-1', domain: 'N', facet: 'immoderation', facetZh: '易冲动', keyed: 1, text: '我常常一时冲动就行动', ref: 'Often give in to impulses' },
  { id: 'immoderation-2', domain: 'N', facet: 'immoderation', facetZh: '易冲动', keyed: 1, text: '我很难抵制眼前的诱惑', ref: 'Have difficulty resisting temptations' },
  { id: 'immoderation-3', domain: 'N', facet: 'immoderation', facetZh: '易冲动', keyed: -1, text: '我做事有分寸、能收得住', ref: 'Can control my cravings' },
  { id: 'immoderation-4', domain: 'N', facet: 'immoderation', facetZh: '易冲动', keyed: -1, text: '花销和享乐我都会量力而行', ref: 'Never spend more than I can afford' },
  // facet 6 脆弱 Vulnerability
  { id: 'vulnerability-1', domain: 'N', facet: 'vulnerability', facetZh: '抗压脆弱', keyed: 1, text: '紧急情况下我容易慌乱', ref: 'Panic easily' },
  { id: 'vulnerability-2', domain: 'N', facet: 'vulnerability', facetZh: '抗压脆弱', keyed: 1, text: '事情一多我就感到不堪重负', ref: 'Become overwhelmed by events' },
  { id: 'vulnerability-3', domain: 'N', facet: 'vulnerability', facetZh: '抗压脆弱', keyed: -1, text: '压力之下我仍能稳定发挥', ref: 'Am resilient under stress' },
  { id: 'vulnerability-4', domain: 'N', facet: 'vulnerability', facetZh: '抗压脆弱', keyed: -1, text: '困难接二连三时，我相信自己扛得住', ref: 'Can handle whatever comes' },

  // ================= E · 外向性 =================
  // facet 1 亲和 Friendliness
  { id: 'friendliness-1', domain: 'E', facet: 'friendliness', facetZh: '亲和', keyed: 1, text: '我很容易交上新朋友', ref: 'Make friends easily' },
  { id: 'friendliness-2', domain: 'E', facet: 'friendliness', facetZh: '亲和', keyed: 1, text: '和陌生人相处时我觉得自在', ref: 'Feel comfortable around people' },
  { id: 'friendliness-3', domain: 'E', facet: 'friendliness', facetZh: '亲和', keyed: -1, text: '我会与人保持距离，不轻易走近', ref: 'Keep others at a distance' },
  { id: 'friendliness-4', domain: 'E', facet: 'friendliness', facetZh: '亲和', keyed: -1, text: '别人很难快速跟我熟络起来', ref: 'Am hard to get to know' },
  // facet 2 合群 Gregariousness
  { id: 'gregariousness-1', domain: 'E', facet: 'gregariousness', facetZh: '合群', keyed: 1, text: '我喜欢人多热闹的场合', ref: 'Love large gatherings' },
  { id: 'gregariousness-2', domain: 'E', facet: 'gregariousness', facetZh: '合群', keyed: 1, text: '一群人里我往往是活跃的那一个', ref: 'Liven things up in a group' },
  { id: 'gregariousness-3', domain: 'E', facet: 'gregariousness', facetZh: '合群', keyed: -1, text: '人多的场合我常常想躲开', ref: 'Avoid crowds' },
  { id: 'gregariousness-4', domain: 'E', facet: 'gregariousness', facetZh: '合群', keyed: -1, text: '长时间社交后我需要独处回血', ref: 'Need time alone to recharge' },
  // facet 3 自信主张 Assertiveness
  { id: 'assertiveness-1', domain: 'E', facet: 'assertiveness', facetZh: '自信主张', keyed: 1, text: '我习惯带头把事情组织起来', ref: 'Take charge' },
  { id: 'assertiveness-2', domain: 'E', facet: 'assertiveness', facetZh: '自信主张', keyed: 1, text: '有不同意见时我会直接说出来', ref: 'Say what I think' },
  { id: 'assertiveness-3', domain: 'E', facet: 'assertiveness', facetZh: '自信主张', keyed: -1, text: '我更愿意让别人来拿主意', ref: 'Wait for others to lead the way' },
  { id: 'assertiveness-4', domain: 'E', facet: 'assertiveness', facetZh: '自信主张', keyed: -1, text: '观点不合时我倾向保留自己的意见', ref: 'Keep my opinions to myself' },
  // facet 4 活跃 Activity Level
  { id: 'activity-1', domain: 'E', facet: 'activity', facetZh: '活跃', keyed: 1, text: '我总是闲不下来', ref: 'Am always on the go' },
  { id: 'activity-2', domain: 'E', facet: 'activity', facetZh: '活跃', keyed: 1, text: '我做事的节奏很快', ref: 'Do things at a rapid pace' },
  { id: 'activity-3', domain: 'E', facet: 'activity', facetZh: '活跃', keyed: -1, text: '我更喜欢慢悠悠的节奏', ref: 'Like to take it easy' },
  { id: 'activity-4', domain: 'E', facet: 'activity', facetZh: '活跃', keyed: -1, text: '什么也不做、放空的时候我最自在', ref: 'Am comfortable doing nothing' },
  // facet 5 刺激寻求 Excitement-Seeking
  { id: 'excitement-1', domain: 'E', facet: 'excitementSeeking', facetZh: '刺激寻求', keyed: 1, text: '我喜欢出乎意料的冒险', ref: 'Love unexpected adventures' },
  { id: 'excitement-2', domain: 'E', facet: 'excitementSeeking', facetZh: '刺激寻求', keyed: 1, text: '高风险的体验项目我愿意尝试', ref: 'Am willing to try risky experiences' },
  { id: 'excitement-3', domain: 'E', facet: 'excitementSeeking', facetZh: '刺激寻求', keyed: -1, text: '我偏好安稳、可预期的安排', ref: 'Prefer familiar routines' },
  { id: 'excitement-4', domain: 'E', facet: 'excitementSeeking', facetZh: '刺激寻求', keyed: -1, text: '极限运动对我没有吸引力', ref: 'Avoid dangerous activities' },
  // facet 6 愉悦 Cheerfulness
  { id: 'cheerfulness-1', domain: 'E', facet: 'cheerfulness', facetZh: '愉悦', keyed: 1, text: '我经常心情很好', ref: 'Am often in high spirits' },
  { id: 'cheerfulness-2', domain: 'E', facet: 'cheerfulness', facetZh: '愉悦', keyed: 1, text: '一点小事就能让我开心起来', ref: 'Bubble with enthusiasm' },
  { id: 'cheerfulness-3', domain: 'E', facet: 'cheerfulness', facetZh: '愉悦', keyed: -1, text: '我不太常开怀大笑', ref: 'Rarely laugh out loud' },
  { id: 'cheerfulness-4', domain: 'E', facet: 'cheerfulness', facetZh: '愉悦', keyed: -1, text: '我的日常情绪大多平平淡淡', ref: 'Am seldom cheerful' },

  // ================= O · 开放性 =================
  // facet 1 想象 Imagination
  { id: 'imagination-1', domain: 'O', facet: 'imagination', facetZh: '想象', keyed: 1, text: '我的想象力很丰富', ref: 'Have a vivid imagination' },
  { id: 'imagination-2', domain: 'O', facet: 'imagination', facetZh: '想象', keyed: 1, text: '我常常沉浸在自己的联想里', ref: 'Spend time daydreaming' },
  { id: 'imagination-3', domain: 'O', facet: 'imagination', facetZh: '想象', keyed: -1, text: '我几乎不做白日梦', ref: 'Rarely get lost in thought' },
  { id: 'imagination-4', domain: 'O', facet: 'imagination', facetZh: '想象', keyed: -1, text: '我只关心眼前实际发生的事', ref: 'Keep my attention on the task at hand' },
  // facet 2 艺术兴趣 Artistic Interests
  { id: 'artistic-1', domain: 'O', facet: 'artistic', facetZh: '艺术兴趣', keyed: 1, text: '我喜欢逛博物馆、画廊和展览', ref: 'Appreciate art' },
  { id: 'artistic-2', domain: 'O', facet: 'artistic', facetZh: '艺术兴趣', keyed: 1, text: '别人注意不到的美，我会被打动', ref: 'See beauty in things that others may not notice' },
  { id: 'artistic-3', domain: 'O', facet: 'artistic', facetZh: '艺术兴趣', keyed: -1, text: '我对艺术展览没什么兴趣', ref: 'Am not interested in art' },
  { id: 'artistic-4', domain: 'O', facet: 'artistic', facetZh: '艺术兴趣', keyed: -1, text: '诗歌和散文很难打动我', ref: 'Poetry has little effect on me' },
  // facet 3 情感丰富 Emotionality
  { id: 'emotionality-1', domain: 'O', facet: 'emotionality', facetZh: '情感丰富', keyed: 1, text: '我能清楚感知自己的情绪变化', ref: 'Am aware of my feelings' },
  { id: 'emotionality-2', domain: 'O', facet: 'emotionality', facetZh: '情感丰富', keyed: 1, text: '动人的故事会让我热泪盈眶', ref: 'Get emotional easily' },
  { id: 'emotionality-3', domain: 'O', facet: 'emotionality', facetZh: '情感丰富', keyed: -1, text: '我很少被文艺作品感动', ref: 'Am not easily moved' },
  { id: 'emotionality-4', domain: 'O', facet: 'emotionality', facetZh: '情感丰富', keyed: -1, text: '我很少大喜大悲', ref: 'Rarely get emotional' },
  // facet 4 冒险 Adventurousness
  { id: 'adventurousness-1', domain: 'O', facet: 'adventurousness', facetZh: '尝新冒险', keyed: 1, text: '到新地方我总要试试当地稀奇的食物', ref: 'Try new and exotic foods' },
  { id: 'adventurousness-2', domain: 'O', facet: 'adventurousness', facetZh: '尝新冒险', keyed: 1, text: '换个国家生活对我很有吸引力', ref: 'Would like to live abroad' },
  { id: 'adventurousness-3', domain: 'O', facet: 'adventurousness', facetZh: '尝新冒险', keyed: -1, text: '点菜时我只点熟悉的', ref: 'Prefer familiar dishes' },
  { id: 'adventurousness-4', domain: 'O', facet: 'adventurousness', facetZh: '尝新冒险', keyed: -1, text: '计划外的变动让我很不舒服', ref: 'Dislike changes' },
  // facet 5 智识 Intellect
  { id: 'intellect-1', domain: 'O', facet: 'intellect', facetZh: '智识好奇', keyed: 1, text: '我享受解决复杂困难的问题', ref: 'Enjoy difficult problems' },
  { id: 'intellect-2', domain: 'O', facet: 'intellect', facetZh: '智识好奇', keyed: 1, text: '我喜欢聊抽象概念和底层原理', ref: 'Enjoy discussions about abstract ideas' },
  { id: 'intellect-3', domain: 'O', facet: 'intellect', facetZh: '智识好奇', keyed: -1, text: '有难度的阅读材料我会绕开', ref: 'Avoid difficult reading material' },
  { id: 'intellect-4', domain: 'O', facet: 'intellect', facetZh: '智识好奇', keyed: -1, text: '东西能用就行，我不关心原理', ref: 'Am not interested in how things work' },
  // facet 6 价值开放 Liberalism
  { id: 'liberalism-1', domain: 'O', facet: 'liberalism', facetZh: '价值开放', keyed: 1, text: '我常质疑大家默认接受的规矩', ref: 'Question authority' },
  { id: 'liberalism-2', domain: 'O', facet: 'liberalism', facetZh: '价值开放', keyed: 1, text: '和我们很不一样的生活方式，我也能接受', ref: 'Am open to unconventional lifestyles' },
  { id: 'liberalism-3', domain: 'O', facet: 'liberalism', facetZh: '价值开放', keyed: -1, text: '老传统就该按老规矩遵守', ref: 'Prefer to stick with traditional ways' },
  { id: 'liberalism-4', domain: 'O', facet: 'liberalism', facetZh: '价值开放', keyed: -1, text: '太新潮的观念大多靠不住', ref: 'Am suspicious of new ideas' },

  // ================= A · 宜人性 =================
  // facet 1 信任 Trust
  { id: 'trust-1', domain: 'A', facet: 'trust', facetZh: '信任', keyed: 1, text: '我倾向把人往好处想', ref: 'Believe that others have good intentions' },
  { id: 'trust-2', domain: 'A', facet: 'trust', facetZh: '信任', keyed: 1, text: '别人说的话我默认是可信的', ref: 'Trust what people say' },
  { id: 'trust-3', domain: 'A', facet: 'trust', facetZh: '信任', keyed: -1, text: '我常怀疑别人背后的动机', ref: 'Suspect hidden motives in others' },
  { id: 'trust-4', domain: 'A', facet: 'trust', facetZh: '信任', keyed: -1, text: '先怀疑、再相信，这样更安全', ref: 'Am skeptical of others at first' },
  // facet 2 坦诚 Morality（真诚）
  { id: 'morality-1', domain: 'A', facet: 'morality', facetZh: '坦诚', keyed: 1, text: '不该占的便宜，我从不占', ref: 'Would never take advantage of others' },
  { id: 'morality-2', domain: 'A', facet: 'morality', facetZh: '坦诚', keyed: 1, text: '我表里如一，说的就是想的', ref: 'Behave consistently with my values' },
  { id: 'morality-3', domain: 'A', facet: 'morality', facetZh: '坦诚', keyed: -1, text: '为了把事情办成，说法上可以灵活一点', ref: 'Use flattery to get ahead' },
  { id: 'morality-4', domain: 'A', facet: 'morality', facetZh: '坦诚', keyed: -1, text: '有些场合说点场面话无伤大雅', ref: 'Find it useful to bend the truth at times' },
  // facet 3 利他 Altruism
  { id: 'altruism-1', domain: 'A', facet: 'altruism', facetZh: '利他', keyed: 1, text: '帮别人的忙会让我开心', ref: 'Make others feel welcome' },
  { id: 'altruism-2', domain: 'A', facet: 'altruism', facetZh: '利他', keyed: 1, text: '有人求助时我一般会答应', ref: 'Go out of my way to help others' },
  { id: 'altruism-3', domain: 'A', facet: 'altruism', facetZh: '利他', keyed: -1, text: '陌生人的困难通常与我关系不大', ref: 'Am not interested in other people’s problems' },
  { id: 'altruism-4', domain: 'A', facet: 'altruism', facetZh: '利他', keyed: -1, text: '我习惯先把自己的事顾好', ref: 'Look out for myself first' },
  // facet 4 合作 Cooperation
  { id: 'cooperation-1', domain: 'A', facet: 'cooperation', facetZh: '合作', keyed: 1, text: '团队里有分歧时，我倾向调和', ref: 'Get along well with others' },
  { id: 'cooperation-2', domain: 'A', facet: 'cooperation', facetZh: '合作', keyed: 1, text: '意见不一致时我愿意各退一步', ref: 'Am willing to compromise' },
  { id: 'cooperation-3', domain: 'A', facet: 'cooperation', facetZh: '合作', keyed: -1, text: '讨论时我常坚持己见到底', ref: 'Insist on my own position' },
  { id: 'cooperation-4', domain: 'A', facet: 'cooperation', facetZh: '合作', keyed: -1, text: '很多时候单干比合作省心', ref: 'Prefer to work alone' },
  // facet 5 谦逊 Modesty
  { id: 'modesty-1', domain: 'A', facet: 'modesty', facetZh: '谦逊', keyed: 1, text: '论能力，我觉得自己算是普通人', ref: 'Consider myself an average person' },
  { id: 'modesty-2', domain: 'A', facet: 'modesty', facetZh: '谦逊', keyed: 1, text: '被夸奖时我会先自谦一番', ref: 'Play down my achievements' },
  { id: 'modesty-3', domain: 'A', facet: 'modesty', facetZh: '谦逊', keyed: -1, text: '论能力我高于大多数人', ref: 'Think that I am better than others' },
  { id: 'modesty-4', domain: 'A', facet: 'modesty', facetZh: '谦逊', keyed: -1, text: '我很清楚自己比周围人出色', ref: 'Think highly of myself' },
  // facet 6 共情 Sympathy
  { id: 'sympathy-1', domain: 'A', facet: 'sympathy', facetZh: '共情', keyed: 1, text: '看到别人受苦我会难受', ref: 'Feel sympathy for those who are worse off' },
  { id: 'sympathy-2', domain: 'A', facet: 'sympathy', facetZh: '共情', keyed: 1, text: '我容易体会别人的心情', ref: 'Feel others’ emotions' },
  { id: 'sympathy-3', domain: 'A', facet: 'sympathy', facetZh: '共情', keyed: -1, text: '悲伤的新闻故事很难触动我', ref: 'Am indifferent to the feelings of others' },
  { id: 'sympathy-4', domain: 'A', facet: 'sympathy', facetZh: '共情', keyed: -1, text: '公益募捐打动不了我', ref: 'Am unmoved by charity appeals' },

  // ================= C · 尽责性 =================
  // facet 1 自我效能 Self-Efficacy
  { id: 'selfefficacy-1', domain: 'C', facet: 'selfEfficacy', facetZh: '自我效能', keyed: 1, text: '交给我的事我总能想出办法搞定', ref: 'Know how to get things done' },
  { id: 'selfefficacy-2', domain: 'C', facet: 'selfEfficacy', facetZh: '自我效能', keyed: 1, text: '复杂的任务我也敢接', ref: 'Handle complex problems' },
  { id: 'selfefficacy-3', domain: 'C', facet: 'selfEfficacy', facetZh: '自我效能', keyed: -1, text: '很多事我怀疑自己做不来', ref: 'Doubt my abilities' },
  { id: 'selfefficacy-4', domain: 'C', facet: 'selfEfficacy', facetZh: '自我效能', keyed: -1, text: '我常常低估自己的能力', ref: 'Underestimate my capabilities' },
  // facet 2 条理 Orderliness
  { id: 'orderliness-1', domain: 'C', facet: 'orderliness', facetZh: '条理', keyed: 1, text: '我的物品总是各归其位', ref: 'Like order' },
  { id: 'orderliness-2', domain: 'C', facet: 'orderliness', facetZh: '条理', keyed: 1, text: '我做事讲究流程和方法', ref: 'Follow a plan for my work' },
  { id: 'orderliness-3', domain: 'C', facet: 'orderliness', facetZh: '条理', keyed: -1, text: '我的桌面和房间经常乱糟糟', ref: 'Leave my belongings around' },
  { id: 'orderliness-4', domain: 'C', facet: 'orderliness', facetZh: '条理', keyed: -1, text: '我常常找不到自己放的东西', ref: 'Often misplace my things' },
  // facet 3 尽责 Dutifulness
  { id: 'dutifulness-1', domain: 'C', facet: 'dutifulness', facetZh: '尽责', keyed: 1, text: '答应别人的事我一定兑现', ref: 'Keep my promises' },
  { id: 'dutifulness-2', domain: 'C', facet: 'dutifulness', facetZh: '尽责', keyed: 1, text: '该守的规矩我会遵守', ref: 'Follow rules' },
  { id: 'dutifulness-3', domain: 'C', facet: 'dutifulness', facetZh: '尽责', keyed: -1, text: '有时我会打破自己定下的规矩', ref: 'Break rules now and then' },
  { id: 'dutifulness-4', domain: 'C', facet: 'dutifulness', facetZh: '尽责', keyed: -1, text: '有些规定不必太较真', ref: 'Think some rules are meant to be bent' },
  // facet 4 成就追求 Achievement-Striving
  { id: 'achievement-1', domain: 'C', facet: 'achievement', facetZh: '成就追求', keyed: 1, text: '我给自己定很高的标准', ref: 'Set high standards for myself' },
  { id: 'achievement-2', domain: 'C', facet: 'achievement', facetZh: '成就追求', keyed: 1, text: '不管做什么，我都想做到最好', ref: 'Push myself very hard' },
  { id: 'achievement-3', domain: 'C', facet: 'achievement', facetZh: '成就追求', keyed: -1, text: '差不多就行，我对自己不苛刻', ref: 'Am content with adequate performance' },
  { id: 'achievement-4', domain: 'C', facet: 'achievement', facetZh: '成就追求', keyed: -1, text: '我不太跟别人比成绩', ref: 'Do not strive for excellence' },
  // facet 5 自律 Self-Discipline
  { id: 'selfdiscipline-1', domain: 'C', facet: 'selfDiscipline', facetZh: '自律', keyed: 1, text: '说开始就能开始，我不拖延', ref: 'Start tasks right away' },
  { id: 'selfdiscipline-2', domain: 'C', facet: 'selfDiscipline', facetZh: '自律', keyed: 1, text: '无聊的部分我也能坚持做完', ref: 'Finish tasks despite boring parts' },
  { id: 'selfdiscipline-3', domain: 'C', facet: 'selfDiscipline', facetZh: '自律', keyed: -1, text: '该做的事我常往后拖', ref: 'Postpone unpleasant tasks' },
  { id: 'selfdiscipline-4', domain: 'C', facet: 'selfDiscipline', facetZh: '自律', keyed: -1, text: '需要长期坚持的事我多半半途而废', ref: 'Quitting halfway is common for me' },
  // facet 6 谨慎 Cautiousness
  { id: 'cautiousness-1', domain: 'C', facet: 'cautiousness', facetZh: '谨慎', keyed: 1, text: '做决定前我会反复掂量', ref: 'Think carefully before making decisions' },
  { id: 'cautiousness-2', domain: 'C', facet: 'cautiousness', facetZh: '谨慎', keyed: 1, text: '大额花销我会先仔细评估', ref: 'Weigh the consequences before spending' },
  { id: 'cautiousness-3', domain: 'C', facet: 'cautiousness', facetZh: '谨慎', keyed: -1, text: '我常凭直觉快速拍板', ref: 'Make hasty decisions' },
  { id: 'cautiousness-4', domain: 'C', facet: 'cautiousness', facetZh: '谨慎', keyed: -1, text: '想清楚了再出手，机会往往已经没了', ref: 'Jump into things without thinking' },
];

// ---------------------------------------------------------------------------
// 二元迫选（forced-choice）版本：每个 facet 的正向陈述与反向陈述两两配对
// 配对规则：(items[0], items[2]) → p1，(items[1], items[3]) → p2
// A = 正向（+keyed），B = 反向（-keyed）
// ---------------------------------------------------------------------------

/** 二元迫选对：A = 正向（+keyed）陈述，B = 反向（-keyed）陈述 */
export interface IpipPair {
  id: string;
  domain: BigFiveDomain;
  facet: string;
  facetZh: string;
  /** A 选项（正向陈述） */
  a: { text: string; ref: string };
  /** B 选项（反向陈述） */
  b: { text: string; ref: string };
}

export const ipipPairs: IpipPair[] = [
  // ================= N · 神经质 =================
  // anxiety
  { id: 'anxiety-p1', domain: 'N', facet: 'anxiety', facetZh: '焦虑', a: { text: '我常为各种事情担忧', ref: 'Worry about things' }, b: { text: '大多数时候我都轻松自在', ref: 'Am relaxed most of the time' } },
  { id: 'anxiety-p2', domain: 'N', facet: 'anxiety', facetZh: '焦虑', a: { text: '我很容易被压力压垮', ref: 'Get stressed out easily' }, b: { text: '就算出了状况，我也不太会慌', ref: 'Am not easily bothered by things' } },
  // anger
  { id: 'anger-p1', domain: 'N', facet: 'anger', facetZh: '易怒', a: { text: '我很容易发火', ref: 'Get angry easily' }, b: { text: '我很少被人惹恼', ref: 'Am not easily annoyed' } },
  { id: 'anger-p2', domain: 'N', facet: 'anger', facetZh: '易怒', a: { text: '我会为小事发脾气', ref: 'Lose my temper' }, b: { text: '我能很好地控制自己的情绪', ref: 'Keep my emotions under control' } },
  // depression
  { id: 'depression-p1', domain: 'N', facet: 'depression', facetZh: '低落', a: { text: '我经常情绪低落', ref: 'Often feel blue' }, b: { text: '我很少感到消沉', ref: 'Am seldom in a bad mood' } },
  { id: 'depression-p2', domain: 'N', facet: 'depression', facetZh: '低落', a: { text: '我对自己不太满意', ref: 'Dislike myself' }, b: { text: '我对自己的现状大体满意', ref: 'Feel comfortable with myself' } },
  // selfConsciousness
  { id: 'selfConsciousness-p1', domain: 'N', facet: 'selfConsciousness', facetZh: '社交敏感', a: { text: '我很在意别人对我的看法', ref: 'Worry about what others think of me' }, b: { text: '我不容易感到难为情', ref: 'Am not embarrassed easily' } },
  { id: 'selfConsciousness-p2', domain: 'N', facet: 'selfConsciousness', facetZh: '社交敏感', a: { text: '我怕成为众人关注的焦点', ref: 'Am afraid to draw attention to myself' }, b: { text: '别人怎么评价我，我不太放在心上', ref: 'Am not bothered by others’ opinions' } },
  // immoderation
  { id: 'immoderation-p1', domain: 'N', facet: 'immoderation', facetZh: '易冲动', a: { text: '我常常一时冲动就行动', ref: 'Often give in to impulses' }, b: { text: '我做事有分寸、能收得住', ref: 'Can control my cravings' } },
  { id: 'immoderation-p2', domain: 'N', facet: 'immoderation', facetZh: '易冲动', a: { text: '我很难抵制眼前的诱惑', ref: 'Have difficulty resisting temptations' }, b: { text: '花销和享乐我都会量力而行', ref: 'Never spend more than I can afford' } },
  // vulnerability
  { id: 'vulnerability-p1', domain: 'N', facet: 'vulnerability', facetZh: '抗压脆弱', a: { text: '紧急情况下我容易慌乱', ref: 'Panic easily' }, b: { text: '压力之下我仍能稳定发挥', ref: 'Am resilient under stress' } },
  { id: 'vulnerability-p2', domain: 'N', facet: 'vulnerability', facetZh: '抗压脆弱', a: { text: '事情一多我就感到不堪重负', ref: 'Become overwhelmed by events' }, b: { text: '困难接二连三时，我相信自己扛得住', ref: 'Can handle whatever comes' } },

  // ================= E · 外向性 =================
  // friendliness
  { id: 'friendliness-p1', domain: 'E', facet: 'friendliness', facetZh: '亲和', a: { text: '我很容易交上新朋友', ref: 'Make friends easily' }, b: { text: '我会与人保持距离，不轻易走近', ref: 'Keep others at a distance' } },
  { id: 'friendliness-p2', domain: 'E', facet: 'friendliness', facetZh: '亲和', a: { text: '和陌生人相处时我觉得自在', ref: 'Feel comfortable around people' }, b: { text: '别人很难快速跟我熟络起来', ref: 'Am hard to get to know' } },
  // gregariousness
  { id: 'gregariousness-p1', domain: 'E', facet: 'gregariousness', facetZh: '合群', a: { text: '我喜欢人多热闹的场合', ref: 'Love large gatherings' }, b: { text: '人多的场合我常常想躲开', ref: 'Avoid crowds' } },
  { id: 'gregariousness-p2', domain: 'E', facet: 'gregariousness', facetZh: '合群', a: { text: '一群人里我往往是活跃的那一个', ref: 'Liven things up in a group' }, b: { text: '长时间社交后我需要独处回血', ref: 'Need time alone to recharge' } },
  // assertiveness
  { id: 'assertiveness-p1', domain: 'E', facet: 'assertiveness', facetZh: '自信主张', a: { text: '我习惯带头把事情组织起来', ref: 'Take charge' }, b: { text: '我更愿意让别人来拿主意', ref: 'Wait for others to lead the way' } },
  { id: 'assertiveness-p2', domain: 'E', facet: 'assertiveness', facetZh: '自信主张', a: { text: '有不同意见时我会直接说出来', ref: 'Say what I think' }, b: { text: '观点不合时我倾向保留自己的意见', ref: 'Keep my opinions to myself' } },
  // activity
  { id: 'activity-p1', domain: 'E', facet: 'activity', facetZh: '活跃', a: { text: '我总是闲不下来', ref: 'Am always on the go' }, b: { text: '我更喜欢慢悠悠的节奏', ref: 'Like to take it easy' } },
  { id: 'activity-p2', domain: 'E', facet: 'activity', facetZh: '活跃', a: { text: '我做事的节奏很快', ref: 'Do things at a rapid pace' }, b: { text: '什么也不做、放空的时候我最自在', ref: 'Am comfortable doing nothing' } },
  // excitementSeeking
  { id: 'excitementSeeking-p1', domain: 'E', facet: 'excitementSeeking', facetZh: '刺激寻求', a: { text: '我喜欢出乎意料的冒险', ref: 'Love unexpected adventures' }, b: { text: '我偏好安稳、可预期的安排', ref: 'Prefer familiar routines' } },
  { id: 'excitementSeeking-p2', domain: 'E', facet: 'excitementSeeking', facetZh: '刺激寻求', a: { text: '高风险的体验项目我愿意尝试', ref: 'Am willing to try risky experiences' }, b: { text: '极限运动对我没有吸引力', ref: 'Avoid dangerous activities' } },
  // cheerfulness
  { id: 'cheerfulness-p1', domain: 'E', facet: 'cheerfulness', facetZh: '愉悦', a: { text: '我经常心情很好', ref: 'Am often in high spirits' }, b: { text: '我不太常开怀大笑', ref: 'Rarely laugh out loud' } },
  { id: 'cheerfulness-p2', domain: 'E', facet: 'cheerfulness', facetZh: '愉悦', a: { text: '一点小事就能让我开心起来', ref: 'Bubble with enthusiasm' }, b: { text: '我的日常情绪大多平平淡淡', ref: 'Am seldom cheerful' } },

  // ================= O · 开放性 =================
  // imagination
  { id: 'imagination-p1', domain: 'O', facet: 'imagination', facetZh: '想象', a: { text: '我的想象力很丰富', ref: 'Have a vivid imagination' }, b: { text: '我几乎不做白日梦', ref: 'Rarely get lost in thought' } },
  { id: 'imagination-p2', domain: 'O', facet: 'imagination', facetZh: '想象', a: { text: '我常常沉浸在自己的联想里', ref: 'Spend time daydreaming' }, b: { text: '我只关心眼前实际发生的事', ref: 'Keep my attention on the task at hand' } },
  // artistic
  { id: 'artistic-p1', domain: 'O', facet: 'artistic', facetZh: '艺术兴趣', a: { text: '我喜欢逛博物馆、画廊和展览', ref: 'Appreciate art' }, b: { text: '我对艺术展览没什么兴趣', ref: 'Am not interested in art' } },
  { id: 'artistic-p2', domain: 'O', facet: 'artistic', facetZh: '艺术兴趣', a: { text: '别人注意不到的美，我会被打动', ref: 'See beauty in things that others may not notice' }, b: { text: '诗歌和散文很难打动我', ref: 'Poetry has little effect on me' } },
  // emotionality
  { id: 'emotionality-p1', domain: 'O', facet: 'emotionality', facetZh: '情感丰富', a: { text: '我能清楚感知自己的情绪变化', ref: 'Am aware of my feelings' }, b: { text: '我很少被文艺作品感动', ref: 'Am not easily moved' } },
  { id: 'emotionality-p2', domain: 'O', facet: 'emotionality', facetZh: '情感丰富', a: { text: '动人的故事会让我热泪盈眶', ref: 'Get emotional easily' }, b: { text: '我很少大喜大悲', ref: 'Rarely get emotional' } },
  // adventurousness
  { id: 'adventurousness-p1', domain: 'O', facet: 'adventurousness', facetZh: '尝新冒险', a: { text: '到新地方我总要试试当地稀奇的食物', ref: 'Try new and exotic foods' }, b: { text: '点菜时我只点熟悉的', ref: 'Prefer familiar dishes' } },
  { id: 'adventurousness-p2', domain: 'O', facet: 'adventurousness', facetZh: '尝新冒险', a: { text: '换个国家生活对我很有吸引力', ref: 'Would like to live abroad' }, b: { text: '计划外的变动让我很不舒服', ref: 'Dislike changes' } },
  // intellect
  { id: 'intellect-p1', domain: 'O', facet: 'intellect', facetZh: '智识好奇', a: { text: '我享受解决复杂困难的问题', ref: 'Enjoy difficult problems' }, b: { text: '有难度的阅读材料我会绕开', ref: 'Avoid difficult reading material' } },
  { id: 'intellect-p2', domain: 'O', facet: 'intellect', facetZh: '智识好奇', a: { text: '我喜欢聊抽象概念和底层原理', ref: 'Enjoy discussions about abstract ideas' }, b: { text: '东西能用就行，我不关心原理', ref: 'Am not interested in how things work' } },
  // liberalism
  { id: 'liberalism-p1', domain: 'O', facet: 'liberalism', facetZh: '价值开放', a: { text: '我常质疑大家默认接受的规矩', ref: 'Question authority' }, b: { text: '老传统就该按老规矩遵守', ref: 'Prefer to stick with traditional ways' } },
  { id: 'liberalism-p2', domain: 'O', facet: 'liberalism', facetZh: '价值开放', a: { text: '和我们很不一样的生活方式，我也能接受', ref: 'Am open to unconventional lifestyles' }, b: { text: '太新潮的观念大多靠不住', ref: 'Am suspicious of new ideas' } },

  // ================= A · 宜人性 =================
  // trust
  { id: 'trust-p1', domain: 'A', facet: 'trust', facetZh: '信任', a: { text: '我倾向把人往好处想', ref: 'Believe that others have good intentions' }, b: { text: '我常怀疑别人背后的动机', ref: 'Suspect hidden motives in others' } },
  { id: 'trust-p2', domain: 'A', facet: 'trust', facetZh: '信任', a: { text: '别人说的话我默认是可信的', ref: 'Trust what people say' }, b: { text: '先怀疑、再相信，这样更安全', ref: 'Am skeptical of others at first' } },
  // morality
  { id: 'morality-p1', domain: 'A', facet: 'morality', facetZh: '坦诚', a: { text: '不该占的便宜，我从不占', ref: 'Would never take advantage of others' }, b: { text: '为了把事情办成，说法上可以灵活一点', ref: 'Use flattery to get ahead' } },
  { id: 'morality-p2', domain: 'A', facet: 'morality', facetZh: '坦诚', a: { text: '我表里如一，说的就是想的', ref: 'Behave consistently with my values' }, b: { text: '有些场合说点场面话无伤大雅', ref: 'Find it useful to bend the truth at times' } },
  // altruism
  { id: 'altruism-p1', domain: 'A', facet: 'altruism', facetZh: '利他', a: { text: '帮别人的忙会让我开心', ref: 'Make others feel welcome' }, b: { text: '陌生人的困难通常与我关系不大', ref: 'Am not interested in other people’s problems' } },
  { id: 'altruism-p2', domain: 'A', facet: 'altruism', facetZh: '利他', a: { text: '有人求助时我一般会答应', ref: 'Go out of my way to help others' }, b: { text: '我习惯先把自己的事顾好', ref: 'Look out for myself first' } },
  // cooperation
  { id: 'cooperation-p1', domain: 'A', facet: 'cooperation', facetZh: '合作', a: { text: '团队里有分歧时，我倾向调和', ref: 'Get along well with others' }, b: { text: '讨论时我常坚持己见到底', ref: 'Insist on my own position' } },
  { id: 'cooperation-p2', domain: 'A', facet: 'cooperation', facetZh: '合作', a: { text: '意见不一致时我愿意各退一步', ref: 'Am willing to compromise' }, b: { text: '很多时候单干比合作省心', ref: 'Prefer to work alone' } },
  // modesty
  { id: 'modesty-p1', domain: 'A', facet: 'modesty', facetZh: '谦逊', a: { text: '论能力，我觉得自己算是普通人', ref: 'Consider myself an average person' }, b: { text: '论能力我高于大多数人', ref: 'Think that I am better than others' } },
  { id: 'modesty-p2', domain: 'A', facet: 'modesty', facetZh: '谦逊', a: { text: '被夸奖时我会先自谦一番', ref: 'Play down my achievements' }, b: { text: '我很清楚自己比周围人出色', ref: 'Think highly of myself' } },
  // sympathy
  { id: 'sympathy-p1', domain: 'A', facet: 'sympathy', facetZh: '共情', a: { text: '看到别人受苦我会难受', ref: 'Feel sympathy for those who are worse off' }, b: { text: '悲伤的新闻故事很难触动我', ref: 'Am indifferent to the feelings of others' } },
  { id: 'sympathy-p2', domain: 'A', facet: 'sympathy', facetZh: '共情', a: { text: '我容易体会别人的心情', ref: 'Feel others’ emotions' }, b: { text: '公益募捐打动不了我', ref: 'Am unmoved by charity appeals' } },

  // ================= C · 尽责性 =================
  // selfEfficacy
  { id: 'selfEfficacy-p1', domain: 'C', facet: 'selfEfficacy', facetZh: '自我效能', a: { text: '交给我的事我总能想出办法搞定', ref: 'Know how to get things done' }, b: { text: '很多事我怀疑自己做不来', ref: 'Doubt my abilities' } },
  { id: 'selfEfficacy-p2', domain: 'C', facet: 'selfEfficacy', facetZh: '自我效能', a: { text: '复杂的任务我也敢接', ref: 'Handle complex problems' }, b: { text: '我常常低估自己的能力', ref: 'Underestimate my capabilities' } },
  // orderliness
  { id: 'orderliness-p1', domain: 'C', facet: 'orderliness', facetZh: '条理', a: { text: '我的物品总是各归其位', ref: 'Like order' }, b: { text: '我的桌面和房间经常乱糟糟', ref: 'Leave my belongings around' } },
  { id: 'orderliness-p2', domain: 'C', facet: 'orderliness', facetZh: '条理', a: { text: '我做事讲究流程和方法', ref: 'Follow a plan for my work' }, b: { text: '我常常找不到自己放的东西', ref: 'Often misplace my things' } },
  // dutifulness
  { id: 'dutifulness-p1', domain: 'C', facet: 'dutifulness', facetZh: '尽责', a: { text: '答应别人的事我一定兑现', ref: 'Keep my promises' }, b: { text: '有时我会打破自己定下的规矩', ref: 'Break rules now and then' } },
  { id: 'dutifulness-p2', domain: 'C', facet: 'dutifulness', facetZh: '尽责', a: { text: '该守的规矩我会遵守', ref: 'Follow rules' }, b: { text: '有些规定不必太较真', ref: 'Think some rules are meant to be bent' } },
  // achievement
  { id: 'achievement-p1', domain: 'C', facet: 'achievement', facetZh: '成就追求', a: { text: '我给自己定很高的标准', ref: 'Set high standards for myself' }, b: { text: '差不多就行，我对自己不苛刻', ref: 'Am content with adequate performance' } },
  { id: 'achievement-p2', domain: 'C', facet: 'achievement', facetZh: '成就追求', a: { text: '不管做什么，我都想做到最好', ref: 'Push myself very hard' }, b: { text: '我不太跟别人比成绩', ref: 'Do not strive for excellence' } },
  // selfDiscipline
  { id: 'selfDiscipline-p1', domain: 'C', facet: 'selfDiscipline', facetZh: '自律', a: { text: '说开始就能开始，我不拖延', ref: 'Start tasks right away' }, b: { text: '该做的事我常往后拖', ref: 'Postpone unpleasant tasks' } },
  { id: 'selfDiscipline-p2', domain: 'C', facet: 'selfDiscipline', facetZh: '自律', a: { text: '无聊的部分我也能坚持做完', ref: 'Finish tasks despite boring parts' }, b: { text: '需要长期坚持的事我多半半途而废', ref: 'Quitting halfway is common for me' } },
  // cautiousness
  { id: 'cautiousness-p1', domain: 'C', facet: 'cautiousness', facetZh: '谨慎', a: { text: '做决定前我会反复掂量', ref: 'Think carefully before making decisions' }, b: { text: '我常凭直觉快速拍板', ref: 'Make hasty decisions' } },
  { id: 'cautiousness-p2', domain: 'C', facet: 'cautiousness', facetZh: '谨慎', a: { text: '大额花销我会先仔细评估', ref: 'Weigh the consequences before spending' }, b: { text: '想清楚了再出手，机会往往已经没了', ref: 'Jump into things without thinking' } },
];

// ---------------------------------------------------------------------------
// 阶段一（标准版）计分辅助：facet / domain 结构与校验常量
// ---------------------------------------------------------------------------

export const IPIP_FACETS: { key: string; zh: string; domain: BigFiveDomain }[] = [
  { key: 'anxiety', zh: '焦虑', domain: 'N' },
  { key: 'anger', zh: '易怒', domain: 'N' },
  { key: 'depression', zh: '低落', domain: 'N' },
  { key: 'selfConsciousness', zh: '社交敏感', domain: 'N' },
  { key: 'immoderation', zh: '易冲动', domain: 'N' },
  { key: 'vulnerability', zh: '抗压脆弱', domain: 'N' },
  { key: 'friendliness', zh: '亲和', domain: 'E' },
  { key: 'gregariousness', zh: '合群', domain: 'E' },
  { key: 'assertiveness', zh: '自信主张', domain: 'E' },
  { key: 'activity', zh: '活跃', domain: 'E' },
  { key: 'excitementSeeking', zh: '刺激寻求', domain: 'E' },
  { key: 'cheerfulness', zh: '愉悦', domain: 'E' },
  { key: 'imagination', zh: '想象', domain: 'O' },
  { key: 'artistic', zh: '艺术兴趣', domain: 'O' },
  { key: 'emotionality', zh: '情感丰富', domain: 'O' },
  { key: 'adventurousness', zh: '尝新冒险', domain: 'O' },
  { key: 'intellect', zh: '智识好奇', domain: 'O' },
  { key: 'liberalism', zh: '价值开放', domain: 'O' },
  { key: 'trust', zh: '信任', domain: 'A' },
  { key: 'morality', zh: '坦诚', domain: 'A' },
  { key: 'altruism', zh: '利他', domain: 'A' },
  { key: 'cooperation', zh: '合作', domain: 'A' },
  { key: 'modesty', zh: '谦逊', domain: 'A' },
  { key: 'sympathy', zh: '共情', domain: 'A' },
  { key: 'selfEfficacy', zh: '自我效能', domain: 'C' },
  { key: 'orderliness', zh: '条理', domain: 'C' },
  { key: 'dutifulness', zh: '尽责', domain: 'C' },
  { key: 'achievement', zh: '成就追求', domain: 'C' },
  { key: 'selfDiscipline', zh: '自律', domain: 'C' },
  { key: 'cautiousness', zh: '谨慎', domain: 'C' },
];

export const IPIP_SOURCE = {
  base: 'IPIP-NEO-120（Johnson, 2014）· International Personality Item Pool',
  publisher: 'ipip.ori.org',
  license: 'Public Domain（公有领域）',
  citation: 'Goldberg, L. R. (1999). A broad-bandwidth, public-domain, personality inventory. Johnson, J. A. (2014). Measuring thirty facets of the five factor model.',
  note: '题目条目参照 IPIP 公有领域条目池汉化改编，结构对齐 IPIP-NEO-120（30 facets × 4 题，正反向计分各半）',
};

// ---------------------------------------------------------------------------
// 深度段 · 生活偏好 12 题：情景选择 / 强迫二选一 / 100 点滑杆分配 / 四选一排序
// 核心段已作答 budget / climate / pace / size / social / language / visa / remote
// 这 8 个维度（二元迫选 + 区间选择），此处不再重复，仅补充「深化辨析」型题目；
// 全部映射回现有 6 个序数维（pace/size/social/language/visa/remote）。
// - budget / climate 由核心段的区间题驱动专用契合函数（区间惩罚 / 气候兼容表）
// - 其余 6 个序数维由核心段二元题 + 本题库聚合出 1-5 序数
// ---------------------------------------------------------------------------

export type ProLifestyleKind = 'choice' | 'forced' | 'slider' | 'rank';
export type UserDimKey = 'pace' | 'size' | 'social' | 'language' | 'visa' | 'remote';

type DimContrib = Partial<Record<UserDimKey, number>>;

interface ProLifestyleBase {
  id: string;
  kind: ProLifestyleKind;
  title: string;
  hint?: string;
}

export interface ProChoiceQ extends ProLifestyleBase {
  kind: 'choice';
  options: { value: string; label: string; desc?: string }[];
  ordinalMap: Record<string, DimContrib>;
}

export interface ProForcedQ extends ProLifestyleBase {
  kind: 'forced';
  left: { value: string; label: string; desc?: string };
  right: { value: string; label: string; desc?: string };
  ordinalMap: Record<string, DimContrib>;
}

export interface ProSliderQ extends ProLifestyleBase {
  kind: 'slider';
  dims: { key: UserDimKey; label: string }[];
  total: number;
}

export interface ProRankQ extends ProLifestyleBase {
  kind: 'rank';
  items: { value: UserDimKey; label: string; desc?: string }[];
}

export type ProLifestyleQuestion = ProChoiceQ | ProForcedQ | ProSliderQ | ProRankQ;

/** 排序位置 → 序数（第 1 名 5 分，依次 3.5 / 2.5 / 1） */
export const RANK_ORDINALS = [5, 3.5, 2.5, 1];

export const proLifestyleQuestions: ProLifestyleQuestion[] = [
  // ---- 深化辨析情景选择 4 题（核心段未覆盖的新情景）----
  {
    id: 'socialDepth', kind: 'choice',
    title: '初到一座城市，你最先想建立的连接是？',
    options: [
      { value: 'coworker', label: '联合办公里的工作伙伴', desc: '业务同频，浅而高效' },
      { value: 'hobby', label: '兴趣社群的同好', desc: '攀岩、帆船、读书会' },
      { value: 'locals', label: '当地人的深度友谊', desc: '哪怕语言磕绊也想走进本地生活' },
    ],
    ordinalMap: { coworker: { social: 3, remote: 4 }, hobby: { social: 4 }, locals: { social: 5, language: 4 } },
  },
  {
    id: 'paceShift', kind: 'choice',
    title: '连续赶完一个大项目之后，你会？',
    options: [
      { value: 'keep', label: '立刻投入下一件事', desc: '节奏不断才安心' },
      { value: 'short', label: '休整两天再回到轨道', desc: '张弛有度' },
      { value: 'long', label: '给自己放一个长假', desc: '恢复比进度更重要' },
    ],
    ordinalMap: { keep: { pace: 5 }, short: { pace: 3 }, long: { pace: 1 } },
  },
  {
    id: 'sizeTrade', kind: 'choice',
    title: '同样是房租，你更愿意为什么买单？',
    options: [
      { value: 'convenience', label: '24 小时的便利与资源密度', desc: '深夜餐食、展览、演出' },
      { value: 'space', label: '更大的空间与更近的自然', desc: '阳台、田野、星空' },
    ],
    ordinalMap: { convenience: { size: 5 }, space: { size: 1 } },
  },
  {
    id: 'languageSink', kind: 'choice',
    title: '面对一门全新语言，你愿意投入多少？',
    options: [
      { value: 'dive', label: '报班系统学习到能办事', desc: '三个月内点菜不指图' },
      { value: 'casual', label: '记常用句型，够用就好', desc: '问候、砍价、点单' },
      { value: 'none', label: '不想学，工具解决一切', desc: '时间留给工作与生活' },
    ],
    ordinalMap: { dive: { language: 1 }, casual: { language: 3 }, none: { language: 5 } },
  },
  // ---- 强迫二选一 4 题（两难取舍）----
  {
    id: 'f-pace-social', kind: 'forced',
    title: '两难取舍：哪边更接近你想去的城市？',
    hint: '必须二选一',
    left: { value: 'pace', label: '快节奏机会之城', desc: '活动、会议、资源密度高，但人来人往难深交' },
    right: { value: 'social', label: '慢节奏熟人小城', desc: '邻里相熟、关系绵长，但机会与刺激有限' },
    ordinalMap: { pace: { pace: 4, social: 2 }, social: { social: 4, pace: 2 } },
  },
  {
    id: 'f-language-visa', kind: 'forced',
    title: '两难取舍：哪边你更容易接受？',
    hint: '必须二选一',
    left: { value: 'language', label: '英语畅通但签证繁琐', desc: '沟通零成本，居留手续常折腾' },
    right: { value: 'visa', label: '签证宽松但语言陌生', desc: '停留自由，日常全靠比划' },
    ordinalMap: { language: { language: 4, visa: 2 }, visa: { visa: 4, language: 2 } },
  },
  {
    id: 'f-size-pace', kind: 'forced',
    title: '两难取舍：你会选哪边的生活方式？',
    hint: '必须二选一',
    left: { value: 'size', label: '大都会的十号线', desc: '通勤一小时换全世界' },
    right: { value: 'pace', label: '小城的五分钟', desc: '步行可达的一切与慢下来的时间' },
    ordinalMap: { size: { size: 4, pace: 2 }, pace: { pace: 4, size: 2 } },
  },
  {
    id: 'f-social-remote', kind: 'forced',
    title: '两难取舍：工作日你更看重哪边？',
    hint: '必须二选一',
    left: { value: 'social', label: '共享空间的热闹', desc: '身边有人、随时交流，干扰也多' },
    right: { value: 'remote', label: '稳定专线与专注', desc: '网络、工位与安静，社交靠预约' },
    ordinalMap: { social: { social: 4, remote: 2 }, remote: { remote: 4, social: 2 } },
  },
  // ---- 100 点滑杆分配 2 题 ----
  {
    id: 's-remote', kind: 'slider',
    title: '预算之外，把 100 分的在意度分配到这四件事上：',
    hint: '四项之和必须等于 100',
    dims: [
      { key: 'remote', label: '网络与工位' },
      { key: 'pace', label: '生活节奏' },
      { key: 'social', label: '社交密度' },
      { key: 'size', label: '城市规模' },
    ],
    total: 100,
  },
  {
    id: 's-abroad', kind: 'slider',
    title: '把 100 分的宽容度分给这些「麻烦」——越在意越少给：',
    hint: '四项之和必须等于 100',
    dims: [
      { key: 'language', label: '语言障碍' },
      { key: 'visa', label: '签证手续' },
      { key: 'social', label: '社交成本' },
      { key: 'size', label: '配套稀少' },
    ],
    total: 100,
  },
  // ---- 四选一排序 2 题 ----
  {
    id: 'r-city', kind: 'rank',
    title: '搬去一座新城市，把四种日常按吸引力排序（最向往排最前）：',
    items: [
      { value: 'pace', label: '高效会议与快节奏' },
      { value: 'social', label: '邻里熟人的小圈子' },
      { value: 'remote', label: '永不断线的工位' },
      { value: 'size', label: '地铁与大型配套' },
    ],
  },
  {
    id: 'r-bureaucracy', kind: 'rank',
    title: '四种「麻烦」，按你最不能忍的程度排序（最不能忍排最前）：',
    items: [
      { value: 'language', label: '语言不通' },
      { value: 'visa', label: '签证材料反复' },
      { value: 'size', label: '城市太小资源少' },
      { value: 'remote', label: '网络不稳定' },
    ],
  },
];
