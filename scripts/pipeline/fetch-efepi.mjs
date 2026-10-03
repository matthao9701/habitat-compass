/**
 * EF EPI（EF English Proficiency Index，国别年度公开报告，引用口径）抓取
 * 来源：https://www.ef.com/wwen/epi/ 页面内嵌数据（countrySlug + efEpiScore + proficiencySlug）
 * 输出：/tmp/pipeline/epi.json { ISO2: { score, band } }
 * band 直接采用 EF 官方 proficiencySlug（very-high / high / moderate / low / very-low）
 */
import fs from 'node:fs';

const html = fs.readFileSync('/tmp/ef.html', 'utf8');

/** countrySlug → ISO2（仅覆盖本项目 100 城涉及国家） */
const SLUG_ISO = {
  portugal: 'PT', spain: 'ES', italy: 'IT', malta: 'MT', croatia: 'HR', greece: 'GR',
  austria: 'AT', netherlands: 'NL', switzerland: 'CH', denmark: 'DK', sweden: 'SE',
  norway: 'NO', finland: 'FI', latvia: 'LV', lithuania: 'LT', estonia: 'EE',
  poland: 'PL', romania: 'RO', bulgaria: 'BG', serbia: 'RS', slovakia: 'SK',
  czechia: 'CZ', 'czech-republic': 'CZ', hungary: 'HU', slovenia: 'SI',
  georgia: 'GE', turkey: 'TR', 'united-arab-emirates': 'AE', israel: 'IL', jordan: 'JO',
  armenia: 'AM', kazakhstan: 'KZ',
  thailand: 'TH', indonesia: 'ID', malaysia: 'MY', singapore: 'SG', vietnam: 'VN',
  cambodia: 'KH', philippines: 'PH', japan: 'JP', 'south-korea': 'KR', korea: 'KR',
  taiwan: 'TW', china: 'CN', 'hong-kong': 'HK', 'hong-kong-sar': 'HK', india: 'IN', 'sri-lanka': 'LK',
  mexico: 'MX', 'united-states': 'US', 'united-states-of-america': 'US', canada: 'CA',
  'puerto-rico': 'PR',
  colombia: 'CO', peru: 'PE', argentina: 'AR', chile: 'CL', uruguay: 'UY', brazil: 'BR',
  morocco: 'MA', egypt: 'EG', tunisia: 'TN', 'south-africa': 'ZA', kenya: 'KE', rwanda: 'RW',
  ghana: 'GH', mauritius: 'MU', 'cape-verde': 'CV',
  australia: 'AU', 'new-zealand': 'NZ', fiji: 'FJ',
};

const re = /"countrySlug":"([a-z-]+)"[^}]*?"efEpiScore":(\d+),"proficiencySlug":"([a-z-]+)"/g;
const out = {};
let m;
while ((m = re.exec(html))) {
  const [, slug, score, band] = m;
  const iso = SLUG_ISO[slug];
  if (iso && !out[iso]) out[iso] = { score: Number(score), band: band.replace('-', ' ') };
}

fs.writeFileSync('/tmp/pipeline/epi.json', JSON.stringify(out, null, 1));
console.log(`EF EPI countries mapped: ${Object.keys(out).length}`);
console.log('sample:', JSON.stringify({ PT: out.PT, TH: out.TH, JP: out.JP, MX: out.MX }));
