import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 自托管字体（OFL 许可，随构建打包，不依赖外部 CDN）
// 第十五轮字体改版（可变字体，一次加载覆盖全字重）：
//   - Fraunces（soft serif，标题/城市名）· Newsreader（衬线点缀/引用）
//   - Manrope（正文/UI/数字：几何人文黑体，数字为真等宽数字，观感比原等宽字体更整洁）
// 性能：仅按需引入 latin / latin-ext 子集，去掉西里尔、希腊等无用子集；
// 中文正文仍走系统黑体栈（见 tailwind.config.js 的 body），避免 ~101 个 CJK 切片拖慢首屏。
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/manrope/wght.css';
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
