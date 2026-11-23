// A gyár szabályai gépi ellenőrzésként: ami egyszer hibaként előkerült, az ne jöhessen vissza (ATNEZES-EREDMENY.md, 2026-11-20).
// Futtatás: node tools/proba/gyar_szabalyok.mjs → 0 HIBA. A kapu.py előtt kötelező.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const gyoker = new URL('../../', import.meta.url).pathname, olv = (f) => readFileSync(join(gyoker, f), 'utf8');
const fajlok = (d) => readdirSync(join(gyoker, d)).flatMap(n => statSync(join(gyoker, d, n)).isDirectory() ? fajlok(join(d, n)) : [join(d, n)]);
let hiba = 0; const H = (szabaly, hol) => { hiba++; console.log('HIBA', szabaly, '–', hol); };

// 1. Nyilvános szövegben nincs helyőrző ([…], „Ernő adja meg”, kitöltendő, TODO). Ami még hiányzik, az nem jelenik meg.
const NYILVANOS = ['tartalom.js', 'oldalak.js', 'oldalak_hosszu.js', 'oldalak_hosszu_en.js', 'blog_alap.js', 'db/seed.sql'];
const HELYORZO = /\[(?:[^\]"'\n]*?(?:kitöltendő|adja meg|to be set|szám|number|ide|TODO|xx)[^\]"'\n]*)\]|\bTODO\b|\bkitöltendő\b|Lorem ipsum/i;
for (const f of NYILVANOS) olv(f).split('\n').forEach((sor, i) => {
  if (/^\s*(\/\/|\/\*|\*|--)/.test(sor)) return;                       // megjegyzés: nem jelenik meg
  if (HELYORZO.test(sor)) H('helyőrző nyilvános szövegben', `${f}:${i + 1}: ${sor.trim().slice(0, 90)}`);
});

// 2. Minden nyilvános POST-végpont kéréskorláttal fut (levélszemét, adatbázis-telítés ellen).
for (const f of fajlok('functions/api').filter(x => x.endsWith('.js'))) {
  const s = olv(f);
  if (/onRequestPost|onRequest\b/.test(s) && !/korlat/.test(s)) H('nyilvános POST kéréskorlát nélkül (_kozos/korlat.js)', f);
  if (/fetch\(['"`]https:\/\/places\.googleapis/.test(s) && !/korlat/.test(s)) H('fizetős külső hívás korlát nélkül', f);
}
// 3. Kezelő-API: belépés-ellenőrzés és saját-eredet ellenőrzés minden kérés előtt.
const adm = olv('functions/admin/api/[[ut]].js');
if (!/await kezelo\(request, env\)/.test(adm)) H('kezelő-API kezelo() nélkül', 'functions/admin/api/[[ut]].js');
if (!/sajatEredet\(request\)/.test(adm)) H('kezelő-API idegen-eredet védelem nélkül', 'functions/admin/api/[[ut]].js');
// a saját belépés végpontja az egyetlen, amelyik belépés nélkül is válaszol: korlát és eredet-védelem nélkül nem mehet ki
const bel = olv('functions/admin/api/belepes.js');
if (!/korlatok\(db, \[\[`belep:ip:/.test(bel) || !/korlatok\(db, \[\[`beuz:ip:/.test(bel)) H('belépő végpont kéréskorlát nélkül', 'functions/admin/api/belepes.js');
if (!/sajatEredet\(request\)/.test(bel)) H('belépő végpont idegen-eredet védelem nélkül', 'functions/admin/api/belepes.js');
if (!/HttpOnly; Secure; SameSite=Strict/.test(olv('functions/_kozos/belepes.js'))) H('a kezelő sütije nem HttpOnly/Secure/SameSite=Strict', 'functions/_kozos/belepes.js');
if (!/^export const BEUZEMELO_HASH = \{ gazda: '[0-9a-f]{64}', uzemelteto: '[0-9a-f]{64}' \};$/m.test(olv('functions/_kozos/belepes.js'))) H('a beüzemelő kódoknak csak a lenyomata állhat a tárolóban', 'functions/_kozos/belepes.js');
// 4. Ár: a foglalás árát a szerver számolja (_kozos/ar.js), nem a böngészőtől veszi.
if (!/arSzamol\(apartman/.test(olv('functions/api/ajanlat.js'))) H('a foglalás ára nem a szerveren számolódik', 'functions/api/ajanlat.js');
// 5. Biztonsági fejlécek a _headers-ben.
const fej = olv('_headers'); for (const k of ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options']) if (!fej.includes(k)) H('hiányzó fejléc', k);
// 6. Szöveg HTML-be csak escape-pel: innerHTML-be tett felhasználói mező e()/esc() nélkül (egyszerű minta).
for (const f of ['app.js', 'admin/admin.js']) olv(f).split('\n').forEach((sor, i) => {
  if (/\+\s*(x|v|a|d|F2)\.(nev|email|szoveg|uzenet|becenev|telefon|megjegyzes)\s*\+/.test(sor)) H('felhasználói szöveg escape nélkül', `${f}:${i + 1}`);
});
// 7. Kezelő-végpont listában szereplő minden mentés-tábla létezik a sémában (a mentés ne hagyjon ki új táblát).
const tablak = [...olv('db/schema.sql').matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(m => m[1]);
for (const t of tablak) if (!adm.includes(`'${t}'`) && !['gyorsitotar', 'kezelo', 'kezelo_munkamenet', 'kezelo_link'].includes(t)) H('a teljes mentésből hiányzó tábla', t);
// a belépés táblái (jelszó-lenyomat, munkamenetek) szándékosan NEM kerülnek a letölthető mentésbe
if (/'kezelo'|'kezelo_munkamenet'|'kezelo_link'/.test(adm)) H('a belépés adatai (fiókok, munkamenetek, linkek) nem kerülhetnek a letölthető mentésbe', 'functions/admin/api/[[ut]].js');
// 8. Őr-szabály a motor szétválasztáshoz (2026-11-23, Péter): a `motor/` mappában nincs ház- vagy helynév; ami házhoz kötött, az `hazak/<ház>/`-ban él.
import { existsSync } from 'node:fs';
const HAZNEV = /akvarell|szegf[uű]|zebegény|zebegeny|ernő|erno|amrita/i;
if (existsSync(join(gyoker, 'motor'))) for (const f of fajlok('motor')) olv(f).split('\n').forEach((sor, i) => {
  if (HAZNEV.test(sor)) H('ház- vagy helynév a motorban (a `hazak/<ház>/`-ba való)', `${f}:${i + 1}: ${sor.trim().slice(0, 80)}`);
});
console.log(hiba, 'HIBA'); process.exit(hiba ? 1 : 0);
