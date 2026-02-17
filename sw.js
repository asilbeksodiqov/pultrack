// hisobIA — Service Worker
// Versiyani o'zgartirsangiz kesh yangilanadi
const CACHE = 'hisobia-v1';

const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── INSTALL ──────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  );
  self.skipWaiting();
});

// ── ACTIVATE: eski keshni o'chirish ──────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API so'rovlari → network-first (oflayn bo'lsa xato qaytaradi, JS fallback ishlaydi)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Shrift va tashqi resurslar → network-first, keshlab qo'yadi
  if (!url.origin.includes(self.location.origin)) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Statik fayllar → cache-first
  e.respondWith(cacheFirst(e.request));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    // API xatosi uchun JSON qaytaramiz — JS bu bilan ishlaydi
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    // HTML so'ralganda index.html qaytaramiz
    if (req.destination === 'document') {
      return caches.match('/index.html');
    }
    return new Response('Oflayn', { status: 503 });
  }
}
