import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 自托管字体（OFL 许可，随构建打包，不依赖外部 CDN）
// 编辑部字体系统（可变字体，一次加载覆盖全字重）：
//   - Fraunces（soft serif，标题/城市名）· Newsreader（衬线点缀/引用）· Inter（英文正文/UI）
//   - JetBrains Mono / IBM Plex Mono（数据等宽）
// 性能：仅按需引入 latin / latin-ext 子集，去掉西里尔、希腊等无用子集；
// 中文正文仍走系统字体栈（见 tailwind.config.js 的 body），避免 ~500 个 CJK 切片拖慢首屏。
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/inter/wght.css';
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
