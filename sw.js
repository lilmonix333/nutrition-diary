/* 营养日记 Service Worker
 * 策略：
 *   页面导航（HTML）→ 网络优先，失败才用缓存；只缓存成功响应
 *   其它静态资源   → 缓存优先，同样只缓存成功响应
 * 关键点：GitHub Pages 重新部署期间会短暂返回 404，
 * 如果把 404 缓存下来，之后打开就会一直 404 —— 必须跳过非 2xx。
 */
const CACHE = 'nutri-diary-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

function putIfOk(req, resp) {
  if (!resp || !resp.ok) return;
  var copy = resp.clone();
  caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () { });
}

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 页面导航：网络优先
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1) {
    e.respondWith(
      fetch(req)
        .then(function (resp) {
          putIfOk(req, resp);
          // 网络返回错误页（例如部署中的 404）时，优先给缓存里能用的页面
          if (!resp.ok) {
            return caches.match('./index.html').then(function (hit) {
              return hit || resp;
            });
          }
          return resp;
        })
        .catch(function () {
          return caches.match(req).then(function (hit) {
            return hit || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // 其它资源：缓存优先
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (resp) {
        putIfOk(req, resp);
        return resp;
      });
    })
  );
});
