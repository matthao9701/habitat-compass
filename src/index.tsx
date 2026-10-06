import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 自托管字体（OFL 许可，随构建打包，不依赖外部 CDN）
// 性能：仅按需引入 latin / latin-ext 子集，去掉西里尔、希腊、越南语等无用子集。
// 中文正文改用系统字体栈（见 tailwind.config.js 的 body），避免引入 ~500 个 CJK 切片文件。
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-ext-400.css';
import '@fontsource/playfair-display/latin-500.css';
import '@fontsource/playfair-display/latin-ext-500.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/playfair-display/latin-ext-600.css';
import '@fontsource/playfair-display/latin-700.css';
import '@fontsource/playfair-display/latin-ext-700.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import '@fontsource/playfair-display/latin-ext-400-italic.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-ext-400.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import '@fontsource/source-serif-4/latin-ext-400-italic.css';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-ext-400.css';
import App from './App';
import './index.css';

const container = document.getElementById('app');

if (!container) {
  throw new Error('App root element #app not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
