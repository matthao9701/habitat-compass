/**
 * IPIP Risk-Taking 精选 10 题（公有领域语句池精选，ipip.ori.org）
 * 口径：5 点自陈量表（1=非常不符合 … 5=非常符合，与 IPIP_SCALE 一致）；
 * keyed=1 正向计分（越同意越冒险偏好），keyed=-1 反向计分。
 * 产出「风险偏好」细分分数，仅用于报告页画像展示，不进引擎加权。
 * 详细来源与许可见 DATA.md 第九节。
 */

export interface RiskQuestion {
  id: string;
  /** 中文题干（「我常…/我是…的人」句式） */
  text: string;
  /** IPIP 英文原句（公有领域，en 模式渲染） */
  ref: string;
  /** 计分方向：1 正向 / -1 反向 */
  keyed: 1 | -1;
}

export const riskQuestions: RiskQuestion[] = [
  { id: 'rk1', text: '我是愿意承担风险的人', ref: 'Take risks', keyed: 1 },
  { id: 'rk2', text: '我喜欢做有挑战、带风险的事', ref: 'Do dangerous things', keyed: 1 },
  { id: 'rk3', text: '我追求兴奋与新鲜刺激的体验', ref: 'Love excitement', keyed: 1 },
  { id: 'rk4', text: '我喜欢探险式、充满未知的新鲜经历', ref: 'Seek adventure', keyed: 1 },
  { id: 'rk5', text: '我常常一时兴起就行动', ref: 'Act on the spur of the moment', keyed: 1 },
  { id: 'rk6', text: '面对重大变动（换城市、换工作），我倾向果断行动而非观望', ref: 'Make bold decisions quickly', keyed: 1 },
  { id: 'rk7', text: '我会有意避开危险或不稳定的情况', ref: 'Avoid dangerous situations', keyed: -1 },
  { id: 'rk8', text: '很多事情会让我感到担心和不安', ref: 'Am afraid of many things', keyed: -1 },
  { id: 'rk9', text: '我更喜欢稳妥保守的做事方式', ref: 'Play it safe', keyed: -1 },
  { id: 'rk10', text: '我倾向待在熟悉可控的环境里', ref: 'Stick to familiar situations', keyed: -1 },
];
