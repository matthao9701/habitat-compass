// 兴趣爱好标签池（与城市 tags 使用同一套 id）

export interface InterestTag {
  id: string;
  label: string;
  desc: string;
}

export const interestTags: InterestTag[] = [
  { id: 'outdoor', label: '户外徒步', desc: '登山 · 骑行 · 露营' },
  { id: 'watersports', label: '水上运动', desc: '冲浪 · 潜水 · 帆船' },
  { id: 'beach', label: '海滩生活', desc: '日落 · 沙滩 · 海风' },
  { id: 'food', label: '美食探索', desc: '街巷小吃 · 在地料理' },
  { id: 'coffee', label: '咖啡文化', desc: '精品咖啡 · 咖啡馆办公' },
  { id: 'arts', label: '艺术文化', desc: '博物馆 · 画廊 · 设计' },
  { id: 'nightlife', label: '夜生活', desc: '音乐现场 · 酒吧 · 俱乐部' },
  { id: 'fitness', label: '健身', desc: '健身房 · 跑步 · 运动社群' },
  { id: 'wellness', label: '瑜伽冥想', desc: '身心灵 · 慢下来' },
  { id: 'pets', label: '宠物友好', desc: '带毛孩子一起生活' },
  { id: 'startup', label: '创业社区', desc: '独立开发者 · 共创空间' },
  { id: 'lgbtq', label: '多元包容', desc: 'LGBTQ+ 友好环境' },
  { id: 'history', label: '历史古迹', desc: '老城 · 遗址 · 文明层叠' },
  { id: 'nature', label: '自然生态', desc: '雨林 · 野生动物 · 国家公园' },
  { id: 'shopping', label: '都市消费', desc: '商圈 · 买手店 · 便利生活' },
  { id: 'festivals', label: '节庆活动', desc: '音乐祭 · 文化庆典' },
];

export const interestLabelById = new Map(interestTags.map((t) => [t.id, t.label]));
