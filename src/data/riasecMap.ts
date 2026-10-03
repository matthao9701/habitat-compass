/**
 * RIASEC 六维 → 兴趣标签权重映射（可调常量）
 * - 键：RIASEC 六维；值：该维高分时应强化的标签 id（必须在 28 标签池内）
 * - 用法见 src/lib/riasec.ts：维度百分位 ≥ RIASEC_BOOST_THRESHOLD 的维，
 *   给对应标签 +1 次重复（与二级子项强化叠加，但总重复次数封顶 RIASEC_REPEAT_CAP）
 */
import type { RiasecKey } from './riasec';

export const RIASEC_TAG_BOOST: Record<RiasecKey, string[]> = {
  // R 实际型：户外/徒步/冲浪/自然/运动类
  R: ['outdoor', 'nature', 'skiing', 'watersports', 'fitness'],
  // I 研究型：科技/写作/摄影记录类
  I: ['crypto', 'writing', 'photo'],
  // A 艺术型：音乐/艺术/电影/美食文化类
  A: ['arts', 'film', 'opera', 'coffee', 'food', 'cook', 'photo'],
  // S 社会型：社群/志愿服务/家庭亲子/友好社群类
  S: ['volunteer', 'family', 'lgbtq', 'pets'],
  // E 企业型：创业/商业/跨界社交/市集类
  E: ['startup', 'nightlife', 'festivals', 'market', 'shopping'],
  // C 常规型：规律作息/养生/结构化慢生活类
  C: ['wellness', 'spa', 'coffee'],
};
