/* 营养日记 Service Worker
 * 页面导航 → 网络优先，失败用缓存；其它资源 → 缓存优先
 */
const CACHE = 'nutri-diary-v2';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1) {
    e.respondWith(fetch(req).then(function (resp) {
      const copy = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () { });
      return resp;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (resp) {
      const copy = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () { });
      return resp;
    });
  }));
});
