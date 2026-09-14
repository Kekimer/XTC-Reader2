// XTC Reader — offline cache with auto-update
const CACHE = 'xtc-reader-v29';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './JournalSansNewB.otf',
  './JournalSansNewR.otf',
  './JournalSansNewI.otf',
  './pattern.png',
  './pattern-cover.png',
  './icon-96.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const isDoc = req.mode === 'navigate' ||
                req.destination === 'document' ||
                req.url.endsWith('/index.html') ||
                req.url.endsWith('/');

  if (isDoc) {
    // Network-first: always try the freshest HTML online, fall back to cache offline.
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // Cache-first for static assets.
    e.respondWith(
      caches.match(req).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        });
      })
    );
  }
});
