/**
 * generate-icons.mjs — 生成站点图标族（favicon / PWA / iOS / maskable）。
 *
 * 设计：深海蓝圆角方块底 + 纸白罗盘环 + 陶土「正北」指针的方位罗盘花。
 * 取色全部来自 tailwind.config.js 的品牌 token（pine / paper / clay），与主站同源。
 * 单一 SVG 事实源，按需栅格化为各尺寸 PNG，保证 16px 小图标到 512px 应用图标一致。
 *
 * 用法：node scripts/generate-icons.mjs
 * 依赖：sharp（开发环境已有）。产物写入 public/。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');

// 品牌 token（与 tailwind.config.js 一致）
const PINE = '#1D3557'; // 深海航海蓝
const PAPER = '#F9F8F6'; // 燕麦羊皮纸
const CLAY = '#C96A52'; // 暖赤陶

/** 方位罗盘花 SVG（512 视口，中心 256,256） */
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="116" fill="${PINE}"/>
  <g>
    <!-- 方位环 -->
    <circle cx="256" cy="256" r="150" fill="none" stroke="${PAPER}" stroke-width="11" opacity="0.9"/>
    <circle cx="256" cy="256" r="118" fill="none" stroke="${PAPER}" stroke-width="4" opacity="0.32"/>
    <!-- 八向刻度 -->
    <g stroke="${PAPER}" stroke-width="12" stroke-linecap="round" opacity="0.9">
      <line x1="256" y1="106" x2="256" y2="136"/>
      <line x1="256" y1="376" x2="256" y2="406"/>
      <line x1="106" y1="256" x2="136" y2="256"/>
      <line x1="376" y1="256" x2="406" y2="256"/>
    </g>
    <g stroke="${PAPER}" stroke-width="7" stroke-linecap="round" opacity="0.45">
      <line x1="362" y1="150" x2="344" y2="168"/>
      <line x1="150" y1="150" x2="168" y2="168"/>
      <line x1="150" y1="362" x2="168" y2="344"/>
      <line x1="362" y1="362" x2="344" y2="344"/>
    </g>
    <!-- 四隅向短星尖 -->
    <g fill="${PAPER}" opacity="0.4">
      <path d="M256 174 L270 256 L256 242 L242 256 Z" transform="rotate(45 256 256)"/>
      <path d="M256 174 L270 256 L256 242 L242 256 Z" transform="rotate(135 256 256)"/>
      <path d="M256 174 L270 256 L256 242 L242 256 Z" transform="rotate(225 256 256)"/>
      <path d="M256 174 L270 256 L256 242 L242 256 Z" transform="rotate(315 256 256)"/>
    </g>
    <!-- 主四向星尖：正北陶土，其余纸白 -->
    <path d="M256 148 L284 256 L256 234 L228 256 Z" fill="${CLAY}"/>
    <path d="M256 364 L228 256 L256 278 L284 256 Z" fill="${PAPER}" opacity="0.92"/>
    <path d="M364 256 L256 284 L278 256 L256 228 Z" fill="${PAPER}" opacity="0.66"/>
    <path d="M148 256 L256 228 L234 256 L256 284 Z" fill="${PAPER}" opacity="0.66"/>
    <circle cx="256" cy="256" r="11" fill="${PAPER}"/>
  </g>
</svg>`;

/** 可遮罩版（maskable）：满幅底色 + 内容缩至安全区（内 78%），供 Android 自适应裁切 */
export const ICON_MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${PINE}"/>
  <g transform="translate(256 256) scale(0.78) translate(-256 -256)">
    <circle cx="256" cy="256" r="150" fill="none" stroke="${PAPER}" stroke-width="11" opacity="0.9"/>
    <circle cx="256" cy="256" r="118" fill="none" stroke="${PAPER}" stroke-width="4" opacity="0.32"/>
    <g stroke="${PAPER}" stroke-width="12" stroke-linecap="round" opacity="0.9">
      <line x1="256" y1="106" x2="256" y2="136"/>
      <line x1="256" y1="376" x2="256" y2="406"/>
      <line x1="106" y1="256" x2="136" y2="256"/>
      <line x1="376" y1="256" x2="406" y2="256"/>
    </g>
    <g stroke="${PAPER}" stroke-width="7" stroke-linecap="round" opacity="0.45">
      <line x1="362" y1="150" x2="344" y2="168"/>
      <line x1="150" y1="150" x2="168" y2="168"/>
      <line x1="150" y1="362" x2="168" y2="344"/>
      <line x1="362" y1="362" x2="344" y2="344"/>
    </g>
    <g fill="${PAPER}" opacity="0.4">
      <path d="M256 174 L270 256 L256 242 L242 256 Z" transform="rotate(45 256 256)"/>
      <path d="M256 174 L270 256 L256 242 L242 256 Z" transform="rotate(135 256 256)"/>
      <path d="M256 174 L270 256 L256 242 L242 256 Z" transform="rotate(225 256 256)"/>
      <path d="M256 174 L270 256 L256 242 L242 256 Z" transform="rotate(315 256 256)"/>
    </g>
    <path d="M256 148 L284 256 L256 234 L228 256 Z" fill="${CLAY}"/>
    <path d="M256 364 L228 256 L256 278 L284 256 Z" fill="${PAPER}" opacity="0.92"/>
    <path d="M364 256 L256 284 L278 256 L256 228 Z" fill="${PAPER}" opacity="0.66"/>
    <path d="M148 256 L256 228 L234 256 L256 284 Z" fill="${PAPER}" opacity="0.66"/>
    <circle cx="256" cy="256" r="11" fill="${PAPER}"/>
  </g>
</svg>`;

const svg = Buffer.from(ICON_SVG);
const svgMaskable = Buffer.from(ICON_MASKABLE_SVG);

const RASTER = [
  { file: 'favicon-16.png', size: 16 },
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-192.png', size: 192, source: svgMaskable },
  { file: 'icon-maskable-512.png', size: 512, source: svgMaskable },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const { file, size, source } of RASTER) {
    const png = await sharp(source ?? svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
    fs.writeFileSync(path.join(OUT, file), png);
    console.log(`  ✓ ${file}  ${size}×${size}  ${(png.length / 1024).toFixed(1)} KiB`);
  }
  // favicon.ico：多尺寸（16/32/48）内嵌，兼容旧浏览器与 Windows 任务栏
  const icoSizes = [16, 32, 48];
  const icoImages = await Promise.all(
    icoSizes.map(async (s) => ({ size: s, data: await sharp(svg, { density: 384 }).resize(s, s).png().toBuffer() })),
  );
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), buildIco(icoImages));
  console.log(`  ✓ favicon.ico  ${icoSizes.join('/')}`);
  fs.writeFileSync(path.join(OUT, 'icon.svg'), ICON_SVG);
  console.log('  ✓ icon.svg  (矢量事实源)');
}

/** 组装 ICO 容器（PNG-compressed entries，Vista+ 与主流浏览器均支持） */
function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const blobs = [];
  images.forEach((img, i) => {
    const b = i * 16;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 0); // width
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // color planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(img.data.length, b + 8);
    dir.writeUInt32LE(offset, b + 12);
    offset += img.data.length;
    blobs.push(img.data);
  });
  return Buffer.concat([header, dir, ...blobs]);
}
