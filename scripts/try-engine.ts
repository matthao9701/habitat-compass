import { assess, type UserAnswers } from '../src/lib/engine';
import { mbtiQuestions } from '../src/data/questions';

function buildProfile(profile: 'E_SJF' | 'I_NTJ' | 'party' | 'solo-budget'): UserAnswers {
  const mbti: UserAnswers['mbti'] = {};
  for (const q of mbtiQuestions) {
    if (profile === 'E_SJF') {
      // 外向、实感、情感、判断
      mbti[q.id] = q.axis === 'EI' ? (q.a.pole === 'E' ? 'a' : 'b')
        : q.axis === 'SN' ? (q.a.pole === 'S' ? 'a' : 'b')
        : q.axis === 'TF' ? (q.a.pole === 'F' ? 'a' : 'b')
        : (q.a.pole === 'J' ? 'a' : 'b');
    } else if (profile === 'I_NTJ') {
      mbti[q.id] = q.axis === 'EI' ? (q.a.pole === 'I' ? 'a' : 'b')
        : q.axis === 'SN' ? (q.a.pole === 'N' ? 'a' : 'b')
        : q.axis === 'TF' ? (q.a.pole === 'T' ? 'a' : 'b')
        : (q.a.pole === 'J' ? 'a' : 'b');
    } else if (profile === 'party') {
      mbti[q.id] = q.axis === 'EI' ? (q.a.pole === 'E' ? 'a' : 'b')
        : q.axis === 'SN' ? (q.a.pole === 'N' ? 'a' : 'b')
        : q.axis === 'TF' ? (q.a.pole === 'F' ? 'a' : 'b')
        : (q.a.pole === 'P' ? 'a' : 'b');
    } else {
      mbti[q.id] = q.axis === 'EI' ? (q.a.pole === 'I' ? 'a' : 'b')
        : q.axis === 'SN' ? (q.a.pole === 'S' ? 'a' : 'b')
        : q.axis === 'TF' ? (q.a.pole === 'T' ? 'a' : 'b')
        : (q.a.pole === 'P' ? 'a' : 'b');
    }
  }

  if (profile === 'E_SJF') {
    return {
      mbti,
      lifestyle: {
        budget: '2500-4000', climate: 'mediterranean', pace: 'balanced', size: 'mid',
        social: 'high', language: 'high-english', visa: 'high', remote: 'high',
      },
      interests: ['food', 'startup', 'coffee', 'arts', 'beach'],
    };
  }
  if (profile === 'I_NTJ') {
    return {
      mbti,
      lifestyle: {
        budget: 'gt4000', climate: 'temperate', pace: 'balanced', size: 'mid',
        social: 'low', language: 'high-english', visa: 'low', remote: 'high',
      },
      interests: ['coffee', 'startup', 'history', 'arts'],
    };
  }
  if (profile === 'party') {
    return {
      mbti,
      lifestyle: {
        budget: '1500-2500', climate: 'tropical', pace: 'fast', size: 'metro',
        social: 'high', language: 'no-barrier', visa: 'high', remote: 'mid',
      },
      interests: ['beach', 'nightlife', 'watersports', 'festivals', 'food', 'fitness'],
    };
  }
  return {
    mbti,
    lifestyle: {
      budget: 'lt1000', climate: 'tropical', pace: 'slow', size: 'small',
      social: 'low', language: 'basic', visa: 'high', remote: 'mid',
    },
    interests: ['nature', 'wellness', 'coffee', 'food'],
  };
}

for (const profile of ['E_SJF', 'I_NTJ', 'party', 'solo-budget'] as const) {
  const result = assess(buildProfile(profile));
  console.log(`\n=== ${profile} -> ${result.typeCode} ===`);
  for (const m of result.matches) {
    console.log(
      `${m.match}% ${m.city.nameZh}${' '.repeat(Math.max(0, 8 - m.city.nameZh.length))}` +
        `P${m.personalityFit} L${m.preferenceFit} I${m.interestFit} | ${m.reasons[0]}`,
    );
  }
}
