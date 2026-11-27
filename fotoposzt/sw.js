// Fotóposzt service worker – telepíthető webapp, offline indulás, frissítés jelzése.
// VALTOZAT: minden kiadásnál a tools/fotoposzt_pwa.py írja át (a tartalom hash-e) → a telefon új változatot lát.
const VALTOZAT='61959c69ec62';
const HEJ='fotoposzt-hej-'+VALTOZAT, FUTO='fotoposzt-futo';
const ALAP=['./','index.html','app.js','betolto.js','tervezo.js','frissites.js','manifest.webmanifest','ikon/ikon-192.png','ikon/ikon-512.png','ikon/ikon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(HEJ).then(c=>c.addAll(ALAP)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('fotoposzt-hej-')&&k!==HEJ).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='frissits')self.skipWaiting()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
  // Oldal és kód: a hálózat az első (friss változat), net nélkül a tárolt.
  if(r.mode==='navigate'||/\.(js|webmanifest|json)$/.test(u.pathname)&&!u.pathname.includes('/felismero/')&&!u.pathname.includes('/csomagok/')){
    e.respondWith(fetch(r).then(v=>{const m=v.clone();if(v.ok)caches.open(HEJ).then(c=>c.put(r,m));return v}).catch(()=>caches.match(r,{ignoreSearch:r.mode==='navigate'}).then(x=>x||caches.match('index.html'))));return}
  // Csomag: hálózat első, tárolt tartalék (az ügyfél csomagja net nélkül is betölt).
  if(u.pathname.includes('/csomagok/')){e.respondWith(fetch(r).then(v=>{const m=v.clone();if(v.ok)caches.open(FUTO).then(c=>c.put(r,m));return v}).catch(()=>caches.match(r)));return}
  // Felismerő-modellek, zene, ikon: tárolt az első (nagy, ritkán változik).
  e.respondWith(caches.match(r).then(x=>x||fetch(r).then(v=>{const m=v.clone();if(v.ok)caches.open(FUTO).then(c=>c.put(r,m));return v})))});
