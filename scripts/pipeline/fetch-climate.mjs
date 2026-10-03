/**
 * Open-Meteo Historical Weather API（CC BY 4.0，免 key）气候抓取管道
 * 输入：/tmp/pipeline/selection.json（100 城坐标）
 * 输出：/tmp/pipeline/climate.json  { cityId: { avgTempC, annualPrecipMm, precipDays, sunshineHours, summary } }
 * 时段：2015-01-01 ~ 2024-12-31（近 10 个完整年）；指标 = 逐年计算后取 10 年均值
 * 舒适简评规则：基于年均温/降水/日照的确定性映射（非编造，规则透明）
 */
import fs from 'node:fs';

const API = 'https://archive-api.open-meteo.com/v1/archive';
const UA = { 'User-Agent': 'QijuCompass-data-pipeline/1.0 (static climate aggregation)' };
const START = '2015-01-01';
const END = '2024-12-31';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 气候舒适简评（确定性规则） */
function summarize(avg, precip, sun) {
  const t = avg >= 14 && avg <= 24 ? '四季温和' : avg < 14 ? '冬季偏凉' : '夏季偏热';
  const p = precip <= 700 ? '降水偏少' : precip <= 1300 ? '降水适中' : '降水充沛';
  const s = sun >= 2500 ? '日照充足' : sun >= 1800 ? '日照适中' : '日照较少';
  return `${t}，${p}，${s}`;
}

async function fetchCity(c) {
  const url = `${API}?latitude=${c.lat.toFixed(3)}&longitude=${c.lng.toFixed(3)}&start_date=${START}&end_date=${END}&daily=temperature_2m_mean,precipitation_sum,sunshine_duration&timezone=auto`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const d = j.daily;
      if (!d || !d.time || d.time.length < 3000) throw new Error(`bad daily len ${d?.time?.length}`);
      const years = [...new Set(d.time.map((s) => s.slice(0, 4)))].sort();
      const perYear = years.map((y) => {
        const idx = d.time.map((s, i) => (s.startsWith(y) ? i : -1)).filter((i) => i >= 0);
        const temps = idx.map((i) => d.temperature_2m_mean[i]).filter((v) => v != null);
        const precs = idx.map((i) => d.precipitation_sum[i]).filter((v) => v != null);
        const suns = idx.map((i) => d.sunshine_duration[i]).filter((v) => v != null);
        return {
          temp: temps.reduce((a, b) => a + b, 0) / temps.length,
          precip: precs.reduce((a, b) => a + b, 0),
          precipDays: precs.filter((v) => v >= 1).length,
          sun: suns.reduce((a, b) => a + b, 0) / 3600,
        };
      });
      const avg = (k) => perYear.reduce((s, y) => s + y[k], 0) / perYear.length;
      const avgTempC = +avg('temp').toFixed(1);
      const annualPrecipMm = Math.round(avg('precip'));
      const precipDays = Math.round(avg('precipDays'));
      const sunshineHours = Math.round(avg('sun'));
      return {
        [c.id]: { avgTempC, annualPrecipMm, precipDays, sunshineHours, summary: summarize(avgTempC, annualPrecipMm, sunshineHours) },
      };
    } catch (e) {
      if (attempt === 2) return { [c.id]: null, __err: `${c.id}: ${e.message}` };
      await sleep(1200 * (attempt + 1));
    }
  }
}

async function main() {
  // 可选 argv[2]：输入底座文件（默认 61 新城 selection.json；可传 selection-old.json 补 39 旧城）
  const srcFile = process.argv[2] ?? '/tmp/pipeline/selection.json';
  const selection = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  // 增量模式：已成功的城市跳过（支持失败重跑）
  const out = fs.existsSync('/tmp/pipeline/climate.json')
    ? JSON.parse(fs.readFileSync('/tmp/pipeline/climate.json', 'utf8'))
    : {};
  const errs = [];
  const todo = selection.filter((c) => !out[c.id]);
  console.log(`todo: ${todo.length}/${selection.length}`);
  let done = 0;
  for (const c of todo) {
    Object.assign(out, await fetchCity(c));
    if (out[c.id] === null) errs.push(c.id);
    done++;
    if (done % 10 === 0) {
      console.log(`progress ${done}/${todo.length}`);
      fs.writeFileSync('/tmp/pipeline/climate.json', JSON.stringify(out, null, 1));
    }
    await sleep(350);
  }
  const final = {};
  for (const [k, v] of Object.entries(out)) if (k !== '__err' && v) final[k] = v;
  fs.writeFileSync('/tmp/pipeline/climate.json', JSON.stringify(final, null, 1));
  console.log(`climate done: ${Object.keys(final).length}/${selection.length} cities`);
  if (errs.length) console.log('FAILED:', errs.join(', '));
}

main();
