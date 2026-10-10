import { assess, derivePersonality, type UserAnswers } from '../src/lib/engine';
import { scenarioQuestions } from '../src/data/questions';

type Letter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

/**
 * 构造 SJT 二元迫选作答：目标字母侧选对应选项。
 */
function buildMBTIAnswers(want: { EI: Letter; SN: Letter; TF: Letter; JP: Letter }): UserAnswers['mbti'] {
  const mbti: UserAnswers['mbti'] = {};
  for (const q of scenarioQuestions) {
    const target = want[q.axis];
    // 选择指向目标字母的选项
    mbti[q.id] = (q.a.pole === target) ? 'a' : 'b';
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

// ---- SJT 计分单元验证：全 a / 全 b / 混合 ----
const allA: Record<string, string> = {};
const allB: Record<string, string> = {};
for (const q of scenarioQuestions) {
  allA[q.id] = 'a';
  allB[q.id] = 'b';
}
const edgeA = derivePersonality(allA);
const edgeB = derivePersonality(allB);
console.log(
  'edge cases -> all-a:', edgeA.typeCode,
  '| all-b:', edgeB.typeCode,
);
console.log('all-a axisScores:', JSON.stringify(edgeA.axisScores));
console.log('all-b axisScores:', JSON.stringify(edgeB.axisScores));

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
