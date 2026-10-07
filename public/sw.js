/**
 * sw.js — 栖居罗盘 Service Worker
 *
 * 目标：让 PWA 满足「可安装」条件，并提供基础的离线兜底。
 * 策略：
 *   - 导航请求：网络优先（Network-first），失败时回落到缓存的应用外壳。
 *   - 静态资源（同源 GET）：陈旧可用（Stale-While-Revalidate），后台静默更新。
 *   - 绝不缓存非 GET、跨源或带 Range 的请求，避免污染浏览器缓存。
 *
 * 发版注意：改动缓存策略或关键资源时，请同步提升 CACHE_VERSION，
 * 旧缓存会在 activate 阶段被清理。
 */

const CACHE_VERSION = 'v1';
const PRECACHE = `hc-precache-${CACHE_VERSION}`;
const RUNTIME = `hc-runtime-${CACHE_VERSION}`;

// 应用外壳（首屏必需资源）。构建产物文件名带哈希，无法在此静态列举，
// 因此仅预缓存稳定路由与图标；其余由运行期缓存填充。
const PRECACHE_URLS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // 带 Range 的请求（音视频分片）交给浏览器直连，不进缓存
  if (request.headers.has('range')) return;

  // 页面导航：网络优先，离线时回退到已缓存的外壳
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('/'))
            .then((fallback) => fallback || Response.error()),
        ),
    );
    return;
  }

  // 静态资源：陈旧可用 + 后台更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
