import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 自托管字体（OFL 许可，随构建打包，不依赖外部 CDN）
// 第十七轮字体改版（现代无衬线工具风，可变字体一次加载覆盖全字重）：
//   - Noto Sans SC（SIL OFL，现代黑体）——中英统一主字体，笔画均匀、消除细笔发虚
// 性能：Noto Sans SC 按 unicode-range 切成多片，浏览器仅按页面实际用字拉取所需切片，
// 未经字的中文切片不会下载；仍为纯静态自托管，运行时零第三方请求（隐私政策承诺不变）。
import '@fontsource-variable/noto-sans-sc/wght.css';
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
