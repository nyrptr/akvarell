// ÚT: kezelő – böngészővel, telefonméretben: mind a 13 fül betölt hiba nélkül, és a fő mentések a felületről indítva az adatbázisig eljutnak.
// Őrzi: nincs JavaScript-hiba, hibás kérés, oldalra kilógó tartalom; a kijelölt fül az, amire koppintottunk; a gombok valódi koppintással
// működnek (nem takarja őket semmi); visszaigazolás, naptár, pénz, vendégkönyv, beállítás, szöveg, heti bejegyzés, kihívás-kép mentése.
// Kell hozzá: playwright + chromium (PR-kapu: az `utak` feladat telepíti). Helyben: a globális playwright is jó (PLAYWRIGHT_HELY).
import { createRequire } from 'node:module';
import { deflateSync } from 'node:zlib';
import { ok, vege, get, post, kezelo, B, nap, kovNap, cimrol } from './_kozos.mjs';
let chromium;
for (const hely of [process.env.PLAYWRIGHT_HELY, import.meta.url, '/opt/npm-tools/node_modules/'].filter(Boolean)) { try { ({ chromium } = createRequire(hely)('playwright')); break; } catch (e) { } }
ok(!!chromium, 'a böngészős próbához megvan a playwright'); if (!chromium) vege('kezelo');

// ── előkészítés az API-n: legyen mit mutatni (foglaláskérés, kihívás-kép)
const adat = (await get('/api/adat')).j, ap = adat.apartmanok[0], k = kovNap(2);
await post('/api/ajanlat', { apartman_id: ap.id, erkezes: nap(k), tavozas: nap(k + 2), felnott: 2, gyerek: 0, nev: 'Próba Anna', email: 'anna@proba.test', nyelv: 'hu' });
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const darab = (t, a) => { const tt = Buffer.from(t), h = Buffer.alloc(4), c = Buffer.alloc(4); h.writeUInt32BE(a.length); c.writeUInt32BE(crc(Buffer.concat([tt, a]))); return Buffer.concat([h, tt, a, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(8, 0); ihdr.writeUInt32BE(8, 4); ihdr[8] = 8; ihdr[9] = 2;
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), darab('IHDR', ihdr), darab('IDAT', deflateSync(Buffer.concat(Array.from({ length: 8 }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(24, 0x7a)]))))), darab('IEND', Buffer.alloc(0))]);
const f = new FormData(); f.set('becenev', 'Próba Panni'); f.set('allomas', '3'); f.set('kep', new Blob([PNG], { type: 'image/png' }), 'k.png');
await fetch(B + '/api/kihivas', { method: 'POST', body: f, headers: cimrol(1) });

// ── böngésző, telefonméret
const br = await chromium.launch(), p = await br.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const hibak = [];
p.on('pageerror', e => hibak.push('JS-hiba: ' + e.message));
p.on('console', m => m.type() === 'error' && hibak.push('konzol: ' + m.text().slice(0, 160)));
p.on('response', r => r.status() >= 400 && hibak.push(r.status() + ' ' + r.url().replace(B, '')));
p.on('dialog', d => d.accept());
await p.goto(B + '/admin/');
ok(await p.waitForSelector('.fo-ful [data-ful]', { timeout: 20000 }).then(() => true, () => false), 'a kezelő megnyílik (helyi próbában belépés nélkül)');

const CSOP = { ma: ['ma'], keres: ['keres', 'naptar', 'uzenet', 'penz'], vendegek: ['vendegek', 'vk', 'kihivas'], ar: ['ar', 'tartalom', 'blog'], osszekotes: ['osszekotes', 'fiok'] };
const betolt = () => p.waitForFunction(() => { const t = document.querySelector('#tart'); return t && !/Betöltés…/.test(t.textContent); }, null, { timeout: 20000 }).then(() => true, () => false);
async function ful(fu) {
  const fo = Object.keys(CSOP).find(c => CSOP[c].includes(fu));
  await p.click(`.fo-ful [data-ful="${fo}"]`); await betolt();
  if (fu !== fo) { await p.click(`.al-ful [data-ful="${fu}"]`); }
  return betolt();
}
// 1. mind a 13 fül: betölt, van tartalma, a kijelölés stimmel, nem lóg ki oldalra
for (const fu of Object.values(CSOP).flat()) {
  const elotte = hibak.length, kesz = await ful(fu);
  const a = await p.evaluate(() => ({ hossz: document.querySelector('#tart').textContent.trim().length, szeles: document.documentElement.scrollWidth, ablak: innerWidth, most: [...document.querySelectorAll('.ful .most')].map(x => x.dataset.ful), sugo: !!document.querySelector('details.sugo') }));
  ok(kesz && a.hossz > 10 && a.most.includes(fu) && a.szeles <= a.ablak + 1 && a.sugo && hibak.length === elotte, `fül „${fu}”: betölt, kijelölve, nem lóg ki (${a.szeles} px), van súgója, hiba nélkül`, { ...a, hibak: hibak.slice(elotte) });
}

// 2. mentések a felületről, ellenőrzés az adatbázisból (API)
await ful('keres');
await p.click('.sor [data-a="visszaigazolva"]');
ok(await p.waitForFunction(() => /visszaigazolva/.test(document.querySelector('.sor .allapot')?.className || ''), null, { timeout: 15000 }).then(() => true, () => false)
  && (await kezelo.get('ajanlatok')).j[0].allapot === 'visszaigazolva', 'Kérések: „Visszaigazolva” koppintásra a foglalás visszaigazolt lesz');

await ful('naptar');
const egyNap = await p.evaluate((ma) => [...document.querySelectorAll('[data-n]')].filter(b => b.dataset.n >= ma && !b.classList.contains('foglalt')).pop()?.dataset.n, nap(0));
const apValaszt = await p.inputValue('#n-ap'), foglaltE = async () => ((await kezelo.get(`foglalt?ap=${apValaszt}&ho=${egyNap.slice(0, 7)}`)).j || []).some(x => x.nap === egyNap);
await p.click(`[data-n="${egyNap}"]`); await p.waitForSelector(`[data-n="${egyNap}"].foglalt`, { timeout: 15000 }).catch(() => { });
ok(await foglaltE(), `Naptár: koppintásra a nap (${egyNap}) foglalt lesz`);
await p.click(`[data-n="${egyNap}"]`); await p.waitForSelector(`[data-n="${egyNap}"]:not(.foglalt)`, { timeout: 15000 }).catch(() => { });
ok(!(await foglaltE()), 'Naptár: újabb koppintásra felszabadul');

await ful('penz');
await p.fill('#pz-osszeg', '12345'); await p.click('#pz-ment'); await betolt(); await p.waitForTimeout(600);
ok(((await kezelo.get('penz?ev=' + nap(0).slice(0, 4))).j.sorok || []).some(x => x.osszeg === 12345 && x.auto === 0), 'Pénzügyek: az új tétel (12 345 Ft) bekerül');

await ful('vk');
await p.fill('#tart input[type="text"], #tart input:not([type])', '+36 27 123 456'); await p.click('#vk-ment'); await p.waitForTimeout(800);
ok(JSON.stringify((await kezelo.get('vendegkonyv')).j).includes('+36 27 123 456'), 'Vendégkönyv: a telefonszám mentődik');

await ful('vendegek');
await p.fill('[data-b="visszatero_kedvezmeny"]', '15'); await p.click('#b-ment'); await p.waitForTimeout(800);
const kt = (await post('/api/kartya', { nev: 'Próba Béla', email: 'bela@proba.test' }, cimrol(2))).j;
ok(kt.kedvezmeny === 15, 'Vendégek: a visszatérő kedvezmény (15%) mentődik, az új kártya már ezt mutatja', kt);

await ful('tartalom');
const JEL = 'próba-jel-' + Date.now();
const elso = p.locator('#tart textarea').first(); await elso.fill(JEL);
await p.locator('#tart button', { hasText: 'Mentés' }).first().click();   // az első szövegblokk mentése await p.waitForTimeout(800);
ok(JSON.stringify((await get('/api/adat')).j.tartalom).includes(JEL), 'Szövegek: az átírt szöveg mentődik, és a vendégoldal adatában megjelenik');

await ful('blog');
await p.click('#b-gen'); await p.waitForTimeout(2500);
ok((await kezelo.get('blog')).j.bejegyzesek.length === 1, 'Heti bejegyzés: a gombra elkészül a következő hétvége bejegyzése');

await ful('kihivas');
ok(await p.evaluate(() => { const i = document.querySelector('img.adminkep'); return !!i && i.complete && i.naturalWidth > 0; }) || await p.waitForFunction(() => document.querySelector('img.adminkep')?.naturalWidth > 0, null, { timeout: 8000 }).then(() => true, () => false), 'Kihívás-képek: a beküldött kép látszik a kezelőben');
await p.locator('#tart .sor [data-a]:not([data-a="torol"])').first().click(); await p.waitForTimeout(800);
ok(((await kezelo.get('kihivas')).j || [])[0].jovahagyva === 1 && ((await get('/api/adat')).j.szelfik || []).length === 1, 'Kihívás-képek: jóváhagyás koppintásra, a vendégoldalon megjelenik');

ok(hibak.length === 0, 'a teljes út alatt nem volt JavaScript-hiba és hibás kérés', hibak);
await br.close();
vege('kezelo');
