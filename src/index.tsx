import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 自托管字体（OFL 许可，随构建打包，不依赖外部 CDN）
import '@fontsource/noto-sans-sc/300.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/noto-sans-sc/900.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/400-italic.css';
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
