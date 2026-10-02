import { assess, derivePersonality, type UserAnswers } from '../src/lib/engine';
import { mbtiQuestions } from '../src/data/questions';

type Letter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

/**
 * 构造七级量表作答：目标字母侧给 2/6（接近端点），中立混入 4 模拟真实作答强度。
 */
function buildMBTIAnswers(want: { EI: Letter; SN: Letter; TF: Letter; JP: Letter }): UserAnswers['mbti'] {
  const mbti: UserAnswers['mbti'] = {};
  let step = 0;
  for (const q of mbtiQuestions) {
    step += 1;
    const target = want[q.axis];
    const leftIsTarget = q.left.pole === target;
    // 少量题目保持中立（4），模拟真实用户的犹豫
    mbti[q.id] = step % 7 === 0 ? 4 : leftIsTarget ? 2 : 6;
  }
  return mbti;
}

const PROFILES: Array<{
  name: string;
  want: { EI: Letter; SN: Letter; TF: Letter; JP: Letter };
  answers: Omit<UserAnswers, 'mbti'>;
}> = [
  {
    name: 'ESFJ · 地中海预算',
    want: { EI: 'E', SN: 'S', TF: 'F', JP: 'J' },
    answers: {
      lifestyle: {
        budget: '2500-4000', climate: 'mediterranean', pace: 'balanced', size: 'mid',
        social: 'high', language: 'high-english', visa: 'high', remote: 'high',
      },
      interests: ['food', 'startup', 'coffee', 'arts', 'beach'],
    },
  },
  {
    name: 'INTJ · 高预算独处',
    want: { EI: 'I', SN: 'N', TF: 'T', JP: 'J' },
    answers: {
      lifestyle: {
        budget: 'gt4000', climate: 'temperate', pace: 'balanced', size: 'mid',
        social: 'low', language: 'high-english', visa: 'low', remote: 'high',
      },
      interests: ['coffee', 'startup', 'history', 'arts'],
    },
  },
  {
    name: 'ENFP · 派对型',
    want: { EI: 'E', SN: 'N', TF: 'F', JP: 'P' },
    answers: {
      lifestyle: {
        budget: '1500-2500', climate: 'tropical', pace: 'fast', size: 'metro',
        social: 'high', language: 'no-barrier', visa: 'high', remote: 'mid',
      },
      interests: ['beach', 'nightlife', 'watersports', 'festivals', 'food', 'fitness'],
    },
  },
  {
    name: 'ISTP · 低预算独处',
    want: { EI: 'I', SN: 'S', TF: 'T', JP: 'P' },
    answers: {
      lifestyle: {
        budget: 'lt1000', climate: 'tropical', pace: 'slow', size: 'small',
        social: 'low', language: 'basic', visa: 'high', remote: 'mid',
      },
      interests: ['nature', 'wellness', 'coffee', 'food'],
    },
  },
];

// ---- 七级计分单元验证：全 1 / 全 7 / 全 4 ----
const allLeft: Record<string, number> = {};
const allRight: Record<string, number> = {};
const allNeutral: Record<string, number> = {};
for (const q of mbtiQuestions) {
  allLeft[q.id] = 1;
  allRight[q.id] = 7;
  allNeutral[q.id] = 4;
}
const edgeLeft = derivePersonality(allLeft);
const edgeRight = derivePersonality(allRight);
const edgeNeutral = derivePersonality(allNeutral);
console.log(
  'edge cases -> all-1:', edgeLeft.typeCode,
  '| all-7:', edgeRight.typeCode,
  '| all-4:', edgeNeutral.typeCode,
);
console.log('all-1 axisScores:', JSON.stringify(edgeLeft.axisScores));
console.log('all-7 axisScores:', JSON.stringify(edgeRight.axisScores));
console.log('all-4 axisScores:', JSON.stringify(edgeNeutral.axisScores));

for (const profile of PROFILES) {
  const result = assess({ mbti: buildMBTIAnswers(profile.want), ...profile.answers });
  console.log(`\n=== ${profile.name} -> ${result.typeCode} ===`);
  console.log('axisScores(E/N/F/P %):', JSON.stringify(result.axisScores));
  for (const m of result.matches) {
    console.log(
      `${m.match}% ${m.city.nameZh}${' '.repeat(Math.max(0, 8 - m.city.nameZh.length))}` +
        `P${m.personalityFit} L${m.preferenceFit} I${m.interestFit} | ${m.reasons[0]}`,
    );
  }
}
