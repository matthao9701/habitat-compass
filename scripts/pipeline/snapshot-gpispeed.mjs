// 第七轮国家数据补录：GPI（IEP Global Peace Index 2024）与固定宽带网速
// （Ookla Speedtest Global Index 国家级中位数下行）手工快照 → src/data/countries.json
//
// 口径与声明：
// - GPI：IEP Global Peace Index 2024（163 国/地区榜单）。score = 1-5（越低越和平），rank = 全球排名。
//   本文件数值为「公开报道整理的手工快照」，为近似参考值，以 IEP 原报告为准（引用口径，非转载全文）。
// - 网速：Ookla Speedtest Global Index 国家级中位数（固定宽带，下行 Mbps）公开榜单快照（2025 年内），
//   为近似参考值，以 Ookla 原始口径为准。
// - 两源均为「参考信息层」，不参与引擎加权打分（与国家宏观数据同层）。
// - 库内 65 国中个别不在 GPI 163 国榜单（如 HK 作为地区不单列）时保持 null 并在 sources 注明原因。
//
// 运行：node scripts/pipeline/snapshot-gpispeed.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = join(HERE, '..', '..', 'src', 'data', 'countries.json');

const GPI_2024 = {
  // code: [score, rank] — IEP GPI 2024，公开报道整理的近似快照
  IS: [1.112, 1],
  IE: [1.303, 2],
  AT: [1.32, 3],
  NZ: [1.323, 4],
  SG: [1.339, 5],
  CH: [1.35, 6],
  PT: [1.372, 7],
  DK: [1.382, 8],
  MY: [1.427, 10],
  CA: [1.449, 11],
  CZ: [1.452, 12],
  FI: [1.456, 13],
  HR: [1.461, 14],
  NL: [1.47, 15],
  BE: [1.475, 16],
  SE: [1.482, 17],
  NO: [1.49, 18],
  DE: [1.496, 19],
  JP: [1.525, 20],
  AU: [1.528, 21],
  HU: [1.538, 22],
  EE: [1.552, 24],
  SK: [1.562, 25],
  PL: [1.578, 27],
  LT: [1.586, 28],
  LV: [1.61, 31],
  TW: [1.618, 33],
  GB: [1.626, 34],
  KR: [1.634, 36],
  ES: [1.639, 37],
  IT: [1.652, 39],
  FR: [1.664, 41],
  TH: [1.672, 43],
  PA: [1.679, 44],
  VN: [1.698, 45],
  AR: [1.714, 47],
  AE: [1.729, 49],
  QA: [1.738, 50],
  CL: [1.744, 51],
  RO: [1.752, 53],
  PY: [1.76, 54],
  CR: [1.765, 55],
  GR: [1.773, 57],
  UY: [1.78, 58],
  BW: [1.795, 59],
  ZM: [1.802, 60],
  MN: [1.815, 62],
  PE: [1.83, 64],
  GE: [1.835, 65],
  MA: [1.843, 67],
  RS: [1.85, 69],
  LK: [1.855, 70],
  ME: [1.86, 71],
  AL: [1.865, 72],
  KZ: [1.888, 76],
  BO: [1.9, 78],
  GH: [1.931, 84],
  KG: [1.94, 86],
  BR: [1.949, 88],
  EC: [1.955, 89],
  ID: [1.962, 91],
  TN: [1.968, 93],
  CN: [1.97, 94],
  NP: [1.975, 96],
  TR: [2.05, 103],
  MX: [2.052, 104],
  IN: [2.078, 111],
  US: [2.378, 132],
  EG: [2.601, 148],
  ET: [2.724, 152],
  ZA: [2.36, 122],
  CO: [2.66, 147],
  MT: [1.64, 38],
  AM: [1.91, 80],
  JO: [2.09, 113],
  KH: [1.98, 97],
  PH: [2.1, 115],
  IL: [2.86, 155],
  SN: [1.92, 82],
  RW: [1.96, 90],
  MU: [1.56, 23],
  KE: [2.12, 117],
};

/** GPI 163 国榜单不含的库内地区（保持 null 并注明原因） */
const NOT_IN_GPI = {
  HK: 'GPI 榜单不含（地区不单列）',
  PR: 'GPI 榜单不含（美国地区，不单列）',
  FJ: 'GPI 榜单不含（163 国不含太平洋岛国）',
};

const NET_DOWN_MBPS = {
  // code: [中位数下行 Mbps, 快照期] — Ookla Speedtest Global Index（固定宽带），近似快照
  SG: [310, '2025H1'],
  HK: [270, '2025H1'],
  CL: [231, '2025H1'],
  RO: [228, '2025H1'],
  ES: [214, '2025H1'],
  FR: [206, '2025H1'],
  CN: [200, '2025H1'],
  US: [199, '2025H1'],
  DK: [197, '2025H1'],
  FI: [145, '2025H1'],
  CH: [186, '2025H1'],
  SE: [184, '2025H1'],
  TH: [210, '2025H1'],
  AE: [230, '2025H1'],
  HU: [181, '2025H1'],
  PT: [193, '2025H1'],
  NL: [164, '2025H1'],
  BE: [164, '2025H1'],
  JP: [163, '2025H1'],
  NZ: [156, '2025H1'],
  KR: [154, '2025H1'],
  NO: [147, '2025H1'],
  CA: [146, '2025H1'],
  PL: [144, '2025H1'],
  VN: [136, '2025H1'],
  TW: [131, '2025H1'],
  AT: [128, '2025H1'],
  BG: [128, '2025H1'],
  LT: [112, '2025H1'],
  IT: [109, '2025H1'],
  DE: [108, '2025H1'],
  MY: [115, '2025H1'],
  UK_GBR: [113, '2025H1'], // 占位（不以该键命中）
  GB: [113, '2025H1'],
  IE: [108, '2025H1'],
  IL: [148, '2025H1'],
  CR: [107, '2025H1'],
  PA: [104, '2025H1'],
  UY: [104, '2025H1'],
  EE: [92, '2025H1'],
  LV: [104, '2025H1'],
  SI: [103, '2025H1'],
  CZ: [89, '2025H1'],
  BR: [104, '2025H1'],
  AR: [104, '2025H1'],
  SK: [85, '2025H1'],
  GR: [61, '2025H1'],
  AU: [75, '2025H1'],
  IN: [85, '2025H1'],
  MX: [79, '2025H1'],
  EC: [86, '2025H1'],
  PE: [84, '2025H1'],
  HR: [74, '2025H1'],
  RS: [79, '2025H1'],
  GE: [46, '2025H1'],
  TR: [41, '2025H1'],
  KZ: [104, '2025H1'],
  KG: [78, '2025H1'],
  LK: [51, '2025H1'],
  NP: [70, '2025H1'],
  PH: [96, '2025H1'],
  ID: [33, '2025H1'],
  MA: [46, '2025H1'],
  TN: [41, '2025H1'],
  EG: [44, '2025H1'],
  GH: [46, '2025H1'],
  KE: [46, '2025H1'],
  SN: [36, '2025H1'],
  RW: [35, '2025H1'],
  MU: [46, '2025H1'],
  ET: [25, '2025H1'],
  ZA: [46, '2025H1'],
  FJ: [30, '2025H1'],
  MT: [70, '2025H1'],
  AM: [70, '2025H1'],
  JO: [95, '2025H1'],
  KH: [60, '2025H1'],
  PR: [110, '2025H1'],
  CO: [90, '2025H1'],
};

const GPI_SOURCE =
  'GPI = IEP Global Peace Index 2024（163 国榜单；公开报道整理的手工快照，近似参考值，以 IEP 原报告为准；score 1-5 越低越和平，rank 为全球排名）';
const NET_SOURCE =
  'Ookla Speedtest Global Index（国家级中位数 · 固定宽带下行 Mbps；公开榜单手工快照，近似参考值，以 Ookla 口径为准）';

const list = JSON.parse(readFileSync(TARGET, 'utf-8'));
let gpiHit = 0;
let netHit = 0;
const misses = [];

for (const c of list) {
  const gpi = GPI_2024[c.code];
  if (gpi) {
    c.gpi = { score: gpi[0], rank: gpi[1] };
    c.sources.gpi = GPI_SOURCE;
    gpiHit += 1;
  } else if (NOT_IN_GPI[c.code]) {
    c.gpi = null;
    c.sources.gpi = `null — ${NOT_IN_GPI[c.code]}`;
  }
  const net = NET_DOWN_MBPS[c.code];
  if (net) {
    c.internetMbpsFixed = net[0];
    c.sources.internetMbpsFixed = `${NET_SOURCE}（${net[1]}）`;
    netHit += 1;
  }
  if (!gpi) misses.push(c.code);
}

writeFileSync(TARGET, JSON.stringify(list, null, 1) + '\n', 'utf-8');
console.log(`GPI 补录 ${gpiHit}/${list.length}，网速补录 ${netHit}/${list.length}`);
if (misses.length) console.log('GPI 无榜单数据（保持 null）:', misses.join(' '));
