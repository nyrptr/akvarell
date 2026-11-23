// A szállás árának számítása a szerveren (ugyanaz a szabály, mint az app.js `arSzamol`-jában; a kettő együtt változik,
// egyezésüket a tools/proba/ar_teszt.mjs ellenőrzi). A vendég böngészője által küldött ár így csak tájékoztató: a szerver számol.
import { HAZ } from './haz.js';
const NAPMS = 864e5;
const d12 = (iso) => new Date(iso + 'T12:00:00Z');
export const valosNap = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(d12(iso)) && d12(iso).toISOString().slice(0, 10) === iso;
export const ejszakak = (erk, tav) => Math.round((d12(tav) - d12(erk)) / NAPMS);
export function husvet(ev) {
  const a = ev % 19, b = Math.floor(ev / 100), c = ev % 100, d = Math.floor(b / 4), e2 = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e2 + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(Date.UTC(ev, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1, 12));
}
export function kiemelt(d) {          // a ház szabálya: hazak/<ház>/haz.json ar.kiemelt (hétnapok, hónapok, december, húsvét, pünkösd)
  const K = HAZ.ar.kiemelt, m = d.getUTCMonth() + 1, nap = d.getUTCDate(), wd = d.getUTCDay();
  if (K.hetnapok.includes(wd) || K.honapok.includes(m) || (m === 12 && nap >= K.december_ettol)) return true;
  const kul = Math.round((d - husvet(d.getUTCFullYear())) / NAPMS);
  return (kul >= K.husvet_tol && kul <= K.husvet_ig) || K.punkosd_napok.includes(kul);
}
// a = az apartman sora (ar_hetkoznap, ar_hetvege, ar3_hetkoznap, ar3_hetvege)
export function arSzamol(a, erk, tav, felnott, gyerek) {
  let szallas = 0, ej = 0;
  for (const d = d12(erk), vege = d12(tav); d < vege; d.setUTCDate(d.getUTCDate() + 1), ej++) {
    const hv = kiemelt(d);
    szallas += felnott >= 3 ? (hv ? a.ar3_hetvege : a.ar3_hetkoznap) : (hv ? a.ar_hetvege : a.ar_hetkoznap);
  }
  const R = HAZ.ar;   // a ház árszabálya: hazak/<ház>/haz.json
  return { ej, szallas, gyerek: gyerek * R.gyerek_ejszakankent * ej, egy: ej === 1 ? R.egy_ejszakas_felar : 0, kedvezmeny: ej >= R.hosszu_tartozkodas.min_ejszaka ? Math.round(szallas * R.hosszu_tartozkodas.kedvezmeny_szazalek / 100) : 0, ifa: R.ifa_fo_ejszakankent * felnott * ej };
}
