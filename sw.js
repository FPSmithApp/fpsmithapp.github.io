// FPSmith service worker: uygulamanın internetsiz çalışmasını sağlar.
// Uygulamayı her güncellediğinde aşağıdaki sürümü artır (v1 -> v2), yoksa kullanıcılar eski sürümü görür.
const VERSION = 'fpsmith-v1';
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "drivers.json",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "maskable-192.png",
  "maskable-512.png"
];

self.addEventListener('install', e => {
  // Yeni sürüm hemen devreye girmez; kullanıcı "Yenile"ye dokunduğunda girer.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Sürücü bilgisi: önce internetten taze sürüm, internet yoksa son kaydedilen.
  if (url.pathname.endsWith('drivers.json')) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('drivers.json', copy)); return r; })
      .catch(() => caches.match('drivers.json')));
    return;
  }
  // Diğer her şey: önce cihazdaki kopya, yoksa internet.
  e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(r => r || fetch(e.request)));
});
