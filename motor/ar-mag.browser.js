/* GENERÁLT (scripts/haz_gen.py) a motor/ar-mag.js-ből. Kézzel ne szerkeszd. */
(function () {
// A szállás árának közös magja (motor). Ház-semleges: a ház szabályát (R = a ház beállításának "ar" része) paraméterként kapja.
// ES-modul a szervernek (functions/_kozos/ar.js ezt hívja); a böngészőnek ebből GENERÁLT másolat készül (motor/ar-mag.browser.js, scripts/haz_gen.py).
// Ide ház- vagy helynév NEM kerülhet (tools/proba/gyar_szabalyok.mjs 8. szabály).
const NAPMS = 864e5;
const d12 = (iso) => new Date(iso + 'T12:00:00Z');
const valosNap = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(d12(iso)) && d12(iso).toISOString().slice(0, 10) === iso;
const ejszakak = (erk, tav) => Math.round((d12(tav) - d12(erk)) / NAPMS);
function husvet(ev) {
  const a = ev % 19, b = Math.floor(ev / 100), c = ev % 100, d = Math.floor(b / 4), e2 = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e2 + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(Date.UTC(ev, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1, 12));
}
// kiemelt (hétvégi/szezon) éjszaka-e. x = "ÉÉÉÉ-HH-NN" vagy UTC-dél Date; K = a ház szabálya (hétnapok, hónapok, december, húsvét, pünkösd).
function kiemelt(x, K) {
  const d = typeof x === 'string' ? d12(x) : x, m = d.getUTCMonth() + 1, nap = d.getUTCDate(), wd = d.getUTCDay();
  if (K.hetnapok.includes(wd) || K.honapok.includes(m) || (m === 12 && nap >= K.december_ettol)) return true;
  const kul = Math.round((d - husvet(d.getUTCFullYear())) / NAPMS);
  return (kul >= K.husvet_tol && kul <= K.husvet_ig) || K.punkosd_napok.includes(kul);
}
// a = az apartman sora (ar_hetkoznap, ar_hetvege, ar3_hetkoznap, ar3_hetvege); R = a ház árszabálya.
function szamol(a, erk, tav, felnott, gyerek, R) {
  let szallas = 0, ej = 0;
  for (const d = d12(erk), vege = d12(tav); d < vege; d.setUTCDate(d.getUTCDate() + 1), ej++) {
    const hv = kiemelt(d, R.kiemelt);
    szallas += felnott >= 3 ? (hv ? a.ar3_hetvege : a.ar3_hetkoznap) : (hv ? a.ar_hetvege : a.ar_hetkoznap);
  }
  return { ej, szallas, gyerek: gyerek * R.gyerek_ejszakankent * ej, egy: ej === 1 ? R.egy_ejszakas_felar : 0, kedvezmeny: ej >= R.hosszu_tartozkodas.min_ejszaka ? Math.round(szallas * R.hosszu_tartozkodas.kedvezmeny_szazalek / 100) : 0, ifa: R.ifa_fo_ejszakankent * felnott * ej };
}
window.ARMAG = { valosNap, ejszakak, husvet, kiemelt, szamol };
})();
