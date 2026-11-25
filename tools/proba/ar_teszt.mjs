// A szerver (functions/_kozos/ar.js) és a böngésző (app.js) árszabálya egyezik-e: kiemelt napok 4 évre + teljes árak mintákon.
// Futtatás: TZ=Europe/Budapest node tools/proba/ar_teszt.mjs  → 0 HIBA
import { readFileSync } from 'node:fs';
import * as S from '../../functions/_kozos/ar.js';
import { HAZ } from '../../functions/_kozos/haz.js';
const src = readFileSync(new URL('../../app.js', import.meta.url), 'utf8');
const resz = (nev) => { const i = src.indexOf('function ' + nev + '('); let n = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; if (src[k] === '}' && --n === 0) return src.slice(i, k + 1); } };
const mag = readFileSync(new URL('../../motor/ar-mag.browser.js', import.meta.url), 'utf8');
const K = new Function('HAZ', `var F = { extrak: {} }, nyelv = 'hu', window = {}; function visszaKed() { return 0; } function dt(k) { return new Date(k + "T12:00:00"); }
  ${mag} var ARMAG = window.ARMAG; ${resz('extraOssz')} ${resz('arSzamol')} return { kiemelt: (d) => ARMAG.kiemelt(d.toISOString ? d : d, HAZ.ar.kiemelt), arSzamol, dt };`)(HAZ);
let hiba = 0, db = 0;
const ablak = {}; new Function('window', mag)(ablak); const minEjB = ablak.ARMAG.minEj;
// hosszú hétvége minimum: a böngésző és a szerver ugyanazt adja a ház listájának minden elemére és szélére
for (const [tol, ig, min] of HAZ.ar.hosszu_hetvegek) for (const [e, t] of [[tol, ig], [ig, tol.slice(0, 8) + String(+ig.slice(8) + 3).padStart(2, '0')], ['2020-01-01', '2020-01-02']]) { db++;
  const sz = S.minEj(e, t), b = minEjB(e, t, HAZ.ar.hosszu_hetvegek);
  if (sz !== b) { hiba++; console.log('HIBA minEj', e, t, sz, b); } }
{ const [tol, ig, min] = HAZ.ar.hosszu_hetvegek[0]; db += 3;
  if (S.minEj(tol, ig) !== min) { hiba++; console.log('HIBA minEj: a hétvégén belül', min); }
  if (S.minEj('2020-01-01', '2020-01-02') !== 1) { hiba++; console.log('HIBA minEj: hétköznap 1 éj'); }
  if (S.minEj(ig, tol) !== 1 && ig > tol) { hiba++; console.log('HIBA minEj: fordított'); } }
for (let d = new Date('2026-01-01T12:00:00Z'); d < new Date('2030-01-01T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
  const iso = d.toISOString().slice(0, 10); db++;
  if (K.kiemelt(new Date(iso + 'T12:00:00Z')) !== S.kiemelt(new Date(iso + 'T12:00:00Z'))) { hiba++; console.log('HIBA kiemelt', iso); }
}
const a = { ar_hetkoznap: 41000, ar_hetvege: 52000, ar3_hetkoznap: 50000, ar3_hetvege: 61000 };
for (const [e, t, f, g] of [['2026-12-22', '2026-12-29', 2, 0], ['2027-03-25', '2027-03-30', 3, 1], ['2027-05-14', '2027-05-15', 1, 2], ['2027-06-28', '2027-07-09', 2, 2], ['2027-10-29', '2027-11-02', 2, 0], ['2028-02-27', '2028-03-01', 3, 0]]) {
  const k = K.arSzamol(a, e, t, f, g), s = S.arSzamol(a, e, t, f, g); db++;
  for (const m of ['ej', 'szallas', 'gyerek', 'egy', 'kedvezmeny', 'ifa']) if (k[m] !== s[m]) { hiba++; console.log('HIBA ár', e, t, m, k[m], s[m]); }
}
for (const [x, v] of [['2026-02-30', false], ['2026-13-01', false], ['2028-02-29', true], ['2027-02-29', false]]) if (S.valosNap(x) !== v) { hiba++; console.log('HIBA valosNap', x); }
// Az árszabály a motor szétválasztása előtti (2026-11-23) kód eredményével egyezik: lenyomat 2020–2040 kiemelt napjairól és 3936 tartózkodás áráról.
import { createHash } from 'node:crypto';
const ki = [];
for (let d = new Date('2020-01-01T12:00:00Z'); d < new Date('2041-01-01T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) ki.push(S.kiemelt(new Date(d)) ? 1 : 0);
const A = [{ ar_hetkoznap: 41000, ar_hetvege: 52000, ar3_hetkoznap: 50000, ar3_hetvege: 61000 }, { ar_hetkoznap: 33333, ar_hetvege: 47777, ar3_hetkoznap: 40001, ar3_hetvege: 55555 }];
for (const ap of A) for (let k = new Date('2026-01-01T12:00:00Z'); k < new Date('2028-01-01T12:00:00Z'); k.setUTCDate(k.getUTCDate() + 9))
  for (const ej of [1, 2, 3, 5, 7, 14]) for (const [f, g] of [[1, 0], [2, 1], [3, 2], [4, 0]]) {
    const e = k.toISOString().slice(0, 10), t = new Date(k.getTime() + ej * 864e5).toISOString().slice(0, 10), r = S.arSzamol(ap, e, t, f, g); ki.push(r.ej, r.szallas, r.gyerek, r.egy, r.kedvezmeny, r.ifa);
  }
const LENYOMAT = 'b18a6f5f953f2ff3', most = createHash('sha256').update(ki.join(',')).digest('hex').slice(0, 16); db++;
if (most !== LENYOMAT) { hiba++; console.log('HIBA lenyomat: az árszabály eredménye eltér a szétválasztás előtti kódétól', most, '≠', LENYOMAT, '(ha a ház szabálya szándékosan változott, a lenyomatot a haz.json-ra kell újraszámolni)'); }
console.log(db, 'eset,', hiba, 'HIBA'); process.exit(hiba ? 1 : 0);
