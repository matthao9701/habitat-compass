import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 把体积大且长期稳定的第三方库拆成独立 chunk：
        // 1) 首屏可与业务代码并行下载解析；2) 发版时命中浏览器缓存，用户只需重下业务 chunk。
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/].pnpm[\\/]?(react|react-dom|scheduler)@/.test(id) || /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (/motion-dom|motion-utils|framer-motion/.test(id)) return 'vendor-motion';
          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: {
      overlay: true,
      path: '/hot/vite-hmr',
      port: 6000,
      clientPort: 443,
      timeout: 30000,
    },
    watch: {
      usePolling: true,
      interval: 100,
    }
  },
});
