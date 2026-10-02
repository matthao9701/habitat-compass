// 迭代一验证：演示档案自洽性 + 39 城优劣势规则覆盖（pnpm tsx scripts/verify-iter1.ts）
import { cities } from '../src/data';
import { DEMO_PROFILES, buildDemoAnswers } from '../src/data/demoProfiles';
import { assess } from '../src/lib/engine';
import { cityPros, cityCons } from '../src/lib/analysis';

console.log('=== 演示档案自洽性 ===');
for (const profile of DEMO_PROFILES) {
  const result = assess(buildDemoAnswers(profile));
  const top = result.matches.slice(0, 5).map((m) => `${m.match}% ${m.city.nameZh}`);
  const ok = result.typeCode === profile.expectedType ? 'OK ' : 'FAIL';
  console.log(`${ok} ${profile.label} -> ${result.typeCode}（预期 ${profile.expectedType}）`);
  console.log(`     Top5: ${top.join(' · ')}`);
}

console.log('\n=== 39 城优劣势覆盖 ===');
let bad = 0;
for (const city of cities) {
  const pros = cityPros(city);
  const cons = cityCons(city);
  if (pros.length < 3 || cons.length < 2) {
    bad++;
    console.log(`FAIL ${city.id}: pros=${pros.length} cons=${cons.length}`);
  }
}
console.log(bad === 0 ? `全部 ${cities.length} 城满足 3 优势 + 2 注意事项` : `${bad} 城不达标`);

// 抽样打印两座城市的优劣势，人工核对文案
for (const id of ['lisbon', 'cape-town']) {
  const city = cities.find((c) => c.id === id);
  if (!city) continue;
  console.log(`\n--- ${city.id} ---`);
  console.log('优势:', cityPros(city).join(' | '));
  console.log('注意:', cityCons(city).join(' | '));
}
