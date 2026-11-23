// A szerver (functions/_kozos/ar.js) és a böngésző (app.js) árszabálya egyezik-e: kiemelt napok 4 évre + teljes árak mintákon.
// Futtatás: TZ=Europe/Budapest node tools/proba/ar_teszt.mjs  → 0 HIBA
import { readFileSync } from 'node:fs';
import * as S from '../../functions/_kozos/ar.js';
import { HAZ } from '../../functions/_kozos/haz.js';
const src = readFileSync(new URL('../../app.js', import.meta.url), 'utf8');
const resz = (nev) => { const i = src.indexOf('function ' + nev + '('); let n = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; if (src[k] === '}' && --n === 0) return src.slice(i, k + 1); } };
const K = new Function('HAZ', `var F = { extrak: {} }, nyelv = 'hu', window = {}; function visszaKed() { return 0; } function dt(k) { return new Date(k + "T12:00:00"); }
  ${resz('husvet')} ${resz('kiemelt')} ${resz('extraOssz')} ${resz('arSzamol')} return { kiemelt, arSzamol, dt };`)(HAZ);
let hiba = 0, db = 0;
for (let d = new Date('2026-01-01T12:00:00Z'); d < new Date('2030-01-01T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
  const iso = d.toISOString().slice(0, 10); db++;
  if (K.kiemelt(K.dt(iso)) !== S.kiemelt(new Date(iso + 'T12:00:00Z'))) { hiba++; console.log('HIBA kiemelt', iso); }
}
const a = { ar_hetkoznap: 41000, ar_hetvege: 52000, ar3_hetkoznap: 50000, ar3_hetvege: 61000 };
for (const [e, t, f, g] of [['2026-12-22', '2026-12-29', 2, 0], ['2027-03-25', '2027-03-30', 3, 1], ['2027-05-14', '2027-05-15', 1, 2], ['2027-06-28', '2027-07-09', 2, 2], ['2027-10-29', '2027-11-02', 2, 0], ['2028-02-27', '2028-03-01', 3, 0]]) {
  const k = K.arSzamol(a, e, t, f, g), s = S.arSzamol(a, e, t, f, g); db++;
  for (const m of ['ej', 'szallas', 'gyerek', 'egy', 'kedvezmeny', 'ifa']) if (k[m] !== s[m]) { hiba++; console.log('HIBA ár', e, t, m, k[m], s[m]); }
}
for (const [x, v] of [['2026-02-30', false], ['2026-13-01', false], ['2028-02-29', true], ['2027-02-29', false]]) if (S.valosNap(x) !== v) { hiba++; console.log('HIBA valosNap', x); }
console.log(db, 'eset,', hiba, 'HIBA'); process.exit(hiba ? 1 : 0);
