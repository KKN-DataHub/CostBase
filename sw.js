/* CostBase — service worker
   หน้าเว็บ: ยิงเน็ตก่อนเสมอ (network-first) ได้ของใหม่ทุกครั้งที่ออนไลน์
             ออฟไลน์ค่อยใช้ตัวที่เก็บไว้ — จะได้ไม่ค้างรุ่นเก่าเวลาอัปเดตไฟล์
   ราคา/ชีท/แผนที่: ไม่แคชเลย ต้องเป็นของสดเสมอ */
const CACHE = 'costbase-v8.14';
const SHELL = ['./', './index.html', './icon-192.png', './icon-512.png',
               './apple-touch-icon.png', './manifest.webmanifest', './แบบฟอร์มนำเข้าราคา.xlsx'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* ข้อมูลสด — ห้ามแคชเด็ดขาด */
  if (/docs\.google\.com|script\.google\.com|googleusercontent|tile|osrm|nominatim/.test(url.host + url.pathname)) return;
  /* ไฟล์ของเว็บเรา — เน็ตก่อน แล้วอัปเดตของที่เก็บไว้ */
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  /* ของนอก (ฟอนต์ / ไลบรารี CDN) — ใช้ที่เก็บไว้ก่อนถ้ามี */
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => r)));
});
