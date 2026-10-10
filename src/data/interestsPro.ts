// 深度段兴趣标签池：12 个「深化」一级标签 + 每类 3 个二级细化子项
// - 核心段已选 16 个基础标签，深度段不再重复，仅补充 12 个更细的兴趣方向（去重后合并）
// - 一级标签与城市 tags 使用同一套 id（12 个标签已同步标注进城市库管道）
// - 二级子项仅用于「强化」所属一级标签的兴趣权重（引擎侧：选中子项的一级标签计双倍权重），
//   不新增城市侧数据结构，不改变召回计算口径。

import type { InterestTag } from './interests';

/** 深度段新增 12 个一级标签（城市库已同步标注）；与核心段 16 个基础标签无重叠 */
export const EXTRA_TAGS: InterestTag[] = [
  { id: 'photo', label: '摄影创作', desc: '扫街 · 风光 · 相机生活' },
  { id: 'skiing', label: '滑雪冬运', desc: '雪场 · 单板双板 · 冰雪季' },
  { id: 'market', label: '市集淘货', desc: '古着 · 跳蚤市场 · 手作' },
  { id: 'film', label: '电影放映', desc: '艺术影院 · 电影节 · 观影会' },
  { id: 'boardgame', label: '桌游电竞', desc: '桌游吧 · 电竞 · 游戏社群' },
  { id: 'volunteer', label: '志愿公益', desc: '环保 · 社区服务 · 公益组织' },
  { id: 'family', label: '亲子家庭', desc: '亲子设施 · 国际学校 · 家庭出游' },
  { id: 'cook', label: '烹饪料理', desc: '菜市场 · 学当地菜 · 厨艺交流' },
  { id: 'spa', label: '温泉桑拿', desc: '温泉 · 汗蒸 · 水疗' },
  { id: 'opera', label: '古典音乐', desc: '交响 · 歌剧 · 音乐厅' },
  { id: 'writing', label: '写作阅读', desc: '书店 · 读书会 · 长文写作' },
  { id: 'crypto', label: 'Web3 社区', desc: '加密 · DAO · 线上协作' },
];

export const interestTagsPro: InterestTag[] = [...EXTRA_TAGS];

export interface InterestSub {
  id: string;
  label: string;
}

/** 二级细化子项：key = 一级标签 id；子项选中 → 所属一级标签兴趣权重强化 */
export const interestSubs: Record<string, InterestSub[]> = {
  outdoor: [
    { id: 'outdoor:hike', label: '山线徒步' },
    { id: 'outdoor:cycling', label: '公路骑行' },
    { id: 'outdoor:camp', label: '露营野炊' },
    { id: 'outdoor:climb', label: '攀岩抱石' },
  ],
  watersports: [
    { id: 'watersports:surf', label: '冲浪' },
    { id: 'watersports:dive', label: '潜水考证' },
    { id: 'watersports:sail', label: '帆船出海' },
  ],
  beach: [
    { id: 'beach:sunset', label: '日落时刻' },
    { id: 'beach:swim', label: '晨泳' },
    { id: 'beach:bar', label: '沙滩酒吧' },
  ],
  food: [
    { id: 'food:street', label: '街边小吃' },
    { id: 'food:fine', label: '餐厅挖宝' },
    { id: 'food:spice', label: '重口挑战' },
    { id: 'food:veg', label: '素食友好' },
  ],
  coffee: [
    { id: 'coffee:roast', label: '手冲与烘豆' },
    { id: 'coffee:work', label: '咖啡馆办公' },
    { id: 'coffee:shop', label: '独立咖啡馆探店' },
  ],
  arts: [
    { id: 'arts:museum', label: '博物馆常客' },
    { id: 'arts:gallery', label: '画廊开幕' },
    { id: 'arts:design', label: '设计周' },
  ],
  nightlife: [
    { id: 'nightlife:live', label: 'Live 现场' },
    { id: 'nightlife:bar', label: '精酿与鸡尾酒' },
    { id: 'nightlife:club', label: '电子乐俱乐部' },
  ],
  fitness: [
    { id: 'fitness:gym', label: '力量训练' },
    { id: 'fitness:run', label: '路跑' },
    { id: 'fitness:mma', label: '格斗课程' },
  ],
  wellness: [
    { id: 'wellness:yoga', label: '瑜伽馆' },
    { id: 'wellness:meditation', label: '冥想静修' },
    { id: 'wellness:retreat', label: '疗愈营' },
  ],
  pets: [
    { id: 'pets:dog', label: '带狗出行' },
    { id: 'pets:cat', label: '猫友' },
    { id: 'pets:cafe', label: '宠物友好店' },
  ],
  startup: [
    { id: 'startup:demo', label: 'Demo Day' },
    { id: 'startup:indie', label: '独立开发者聚会' },
    { id: 'startup:vc', label: '创投沙龙' },
  ],
  lgbtq: [
    { id: 'lgbtq:safe', label: '友好街区' },
    { id: 'lgbtq:pride', label: '骄傲月活动' },
    { id: 'lgbtq:community', label: '社群组织' },
  ],
  history: [
    { id: 'history:oldtown', label: '老城漫步' },
    { id: 'history:ruins', label: '遗址探访' },
    { id: 'history:guide', label: '人文讲解' },
  ],
  nature: [
    { id: 'nature:park', label: '国家公园' },
    { id: 'nature:wildlife', label: '野生动物' },
    { id: 'nature:bird', label: '观鸟' },
  ],
  shopping: [
    { id: 'shopping:mall', label: '大型商圈' },
    { id: 'shopping:select', label: '买手店' },
    { id: 'shopping:local', label: '在地品牌' },
  ],
  festivals: [
    { id: 'festivals:music', label: '音乐节' },
    { id: 'festivals:traditional', label: '传统庆典' },
    { id: 'festivals:food', label: '美食节' },
  ],
  photo: [
    { id: 'photo:street', label: '扫街' },
    { id: 'photo:landscape', label: '风光日出' },
    { id: 'photo:darkroom', label: '胶片冲扫' },
  ],
  skiing: [
    { id: 'skiing:snowboard', label: '单板' },
    { id: 'skiing:ski', label: '双板' },
    { id: 'skiing:resort', label: '度假村滑雪' },
  ],
  market: [
    { id: 'market:vintage', label: '古着' },
    { id: 'market:flea', label: '跳蚤市场' },
    { id: 'market:craft', label: '手作市集' },
  ],
  film: [
    { id: 'film:arthouse', label: '艺术影院' },
    { id: 'film:fest', label: '电影节' },
    { id: 'film:screening', label: '放映交流会' },
  ],
  boardgame: [
    { id: 'boardgame:board', label: '桌游局' },
    { id: 'boardgame:esports', label: '电竞观赛' },
    { id: 'boardgame:indie', label: '独立游戏' },
  ],
  volunteer: [
    { id: 'volunteer:eco', label: '环保行动' },
    { id: 'volunteer:teach', label: '支教互助' },
    { id: 'volunteer:animal', label: '动物救助' },
  ],
  family: [
    { id: 'family:park', label: '亲子公园' },
    { id: 'family:school', label: '国际学校' },
    { id: 'family:clinic', label: '儿科医疗' },
  ],
  cook: [
    { id: 'cook:market', label: '逛菜市场' },
    { id: 'cook:class', label: '当地料理课' },
    { id: 'cook:share', label: '家庭聚餐' },
  ],
  spa: [
    { id: 'spa:onsen', label: '温泉' },
    { id: 'spa:sauna', label: '桑拿汗蒸' },
    { id: 'spa:massage', label: '按摩理疗' },
  ],
  opera: [
    { id: 'opera:symphony', label: '交响音乐会' },
    { id: 'opera:opera', label: '歌剧' },
    { id: 'opera:chamber', label: '室内乐' },
  ],
  writing: [
    { id: 'writing:bookstore', label: '独立书店' },
    { id: 'writing:club', label: '读书会' },
    { id: 'writing:blog', label: '长文写作' },
  ],
  crypto: [
    { id: 'crypto:meetup', label: 'Web3 线下聚' },
    { id: 'crypto:dao', label: 'DAO 协作' },
    { id: 'crypto:hackathon', label: '黑客松' },
  ],
};

export const interestLabelProById = new Map(interestTagsPro.map((t) => [t.id, t.label]));

/** 标准版兴趣作答结构（存 UserAnswers.interestSubs） */
export type InterestSubSelection = Record<string, string[]>;

/** 选中了子项的一级标签集合（引擎侧强化权重用） */
export function reinforcedTags(selection: InterestSubSelection | undefined): Set<string> {
  const set = new Set<string>();
  if (!selection) return set;
  for (const [parent, subs] of Object.entries(selection)) {
    if (Array.isArray(subs) && subs.length > 0) set.add(parent);
  }
  return set;
}
