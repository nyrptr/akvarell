// A gyár szabályai gépi ellenőrzésként: ami egyszer hibaként előkerült, az ne jöhessen vissza (ATNEZES-EREDMENY.md, 2026-11-20).
// Futtatás: node tools/proba/gyar_szabalyok.mjs → 0 HIBA. A kapu.py előtt kötelező.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const gyoker = new URL('../../', import.meta.url).pathname, olv = (f) => readFileSync(join(gyoker, f), 'utf8');
const fajlok = (d) => readdirSync(join(gyoker, d)).flatMap(n => statSync(join(gyoker, d, n)).isDirectory() ? fajlok(join(d, n)) : [join(d, n)]);
let hiba = 0; const H = (szabaly, hol) => { hiba++; console.log('HIBA', szabaly, '–', hol); };

// 1. Nyilvános szövegben nincs helyőrző ([…], „Ernő adja meg”, kitöltendő, TODO). Ami még hiányzik, az nem jelenik meg.
const NYILVANOS = ['hazak/akvarell/tartalom/tartalom.js', 'hazak/akvarell/tartalom/ui.js', 'hazak/akvarell/tartalom/oldalak.js', 'hazak/akvarell/tartalom/oldalak_hosszu.js', 'hazak/akvarell/tartalom/oldalak_hosszu_en.js', 'hazak/akvarell/tartalom/blog_alap.js', 'hazak/akvarell/db/seed.sql'];
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
// 9. A ház beállításából generált fájlok frissek (haz.json → hazak/<ház>/haz.js és functions/_kozos/haz.js); kézzel szerkesztve nem maradhatnak.
import { spawnSync } from 'node:child_process';
const gen = spawnSync('python3', [join(gyoker, 'scripts/haz_gen.py'), '--ellenoriz'], { encoding: 'utf8' });
if (gen.status !== 0) H('a ház generált fájlja elavult (python3 scripts/haz_gen.py)', (gen.stdout || gen.stderr || '').trim().split('\n')[0]);
// 10. Az árszámítás magja egyetlen helyen él (motor/ar-mag.js); az app.js és a szerver nem tarthat saját másolatot (két helyen beégetett szabály volt a hibaforrás).
if (/function (husvet|kiemelt)\(/.test(olv('app.js'))) H('az app.js saját húsvét/kiemelt-szabályt tartalmaz (a motor/ar-mag.js-ből kell hívni)', 'app.js');
if (/function (husvet|kiemelt)\(|export function (husvet|kiemelt)\(/.test(olv('functions/_kozos/ar.js'))) H('a szerver saját húsvét/kiemelt-szabályt tartalmaz (a motor/ar-mag.js-ből kell hívni)', 'functions/_kozos/ar.js');
// 11. A motor gyökerében nincs ház-tartalom (2026-11-24): a szövegek, oldalak, blog, térkép a `hazak/<ház>/tartalom/` mappában élnek.
for (const f of ['tartalom.js', 'oldalak.js', 'oldalak_hosszu.js', 'oldalak_hosszu_en.js', 'blog_alap.js', 'terkep.js']) if (existsSync(join(gyoker, f))) H('ház-tartalom a motor gyökerében (a `hazak/<ház>/tartalom/`-ba való)', f);
// 12. A felületi szövegek (HU/EN) a házé: ui.js. Mindkét nyelven ugyanazok a kulcsok kellenek (különben az egyik nyelven üres hely marad).
{ const W = {}; new Function('window', olv('hazak/akvarell/tartalom/ui.js'))(W); const hu = Object.keys(W.UI.hu), en = Object.keys(W.UI.en);
  for (const k of hu) if (!en.includes(k)) H('a ui.js angol szövegéből hiányzik a kulcs: ' + k, 'hazak/akvarell/tartalom/ui.js');
  for (const k of en) if (!hu.includes(k)) H('a ui.js magyar szövegéből hiányzik a kulcs: ' + k, 'hazak/akvarell/tartalom/ui.js'); }
// 13. Az app.js-ben nincs beégetett házadat (név, cím, tárolókulcs-előtag, kulcskép): a haz.json-ból jön (HAZ.nev, HAZ.cim, HAZ.azonosito, HAZ.kepek).
for (const [re, mi] of [[/Csalogány|\"akv-|Bereny-apartman-nappali|Szonyi-apartman-furdo-kilatas|akvarellzebegeny/, 'beégetett házadat az app.js-ben (a hazak/<ház>/haz.json-ba való)']]) if (re.test(olv('app.js'))) H(mi, 'app.js');
// 14. A táj (hová esik a ház, melyik vízmérce, melyik élő végpont) a haz.json "taj" részéből jön; az app.js-ben és a szerver végpontjában nincs beégetve.
for (const [f, re] of [['app.js', /47\.80|18\.91|\.nagymaros|\/api\/zebegeny/], ['functions/api/taj.js', /lat=47|lon=18|'Nagymaros'|'Esztergom'/], ['functions/_kozos/blog.js', /lat=47|lon=18|\.nagymaros/]]) if (re.test(olv(f))) H('beégetett táj-adat (a hazak/<ház>/haz.json "taj" részébe való)', f);
// 15. Az app.js-ben (a motor böngészős magjában) nincs házszó. Egyetlen kivétel: a régi #/zebegeny hivatkozás átirányítása.
{ const k = olv('app.js').split('\n').filter(l => !/r\[0\] === "zebegeny"/.test(l)).join('\n'); const m = k.match(/akvarell|szegf[uű]|zebegé|zebegeny|ernő|amrita|szonyi|szőnyi|bereny|berény|karpathy|kárpáthy|dunakan|visegrád|nagymaros|pilis/i);
  if (m) H('házszó az app.js-ben: „' + m[0] + '” (a hazak/<ház>/ mappába való)', 'app.js'); }
// 16. A functions/ mappában nincs házszó (a ház szövegei a hazak/<ház>/ alatt). Kivétel: a generált haz.js / szerver.js, a régi /api/zebegeny cím, és a telepit.js (az adatbázis alapadata: külön lépés).
for (const f of fajlok('functions').filter(x => x.endsWith('.js') && !/_kozos\/(haz|szerver|telepit)\.js$/.test(x) && !/api\/zebegeny\.js$/.test(x))) {
  const m = olv(f).match(/akvarell|szegf[uű]|zebegé|zebegeny|ernő|amrita|szonyi|szőnyi|bereny|berény|karpathy|kárpáthy|dunakan|visegrád|nagymaros|pilis/i);
  if (m) H('házszó a szerver-kódban: „' + m[0] + '”', f); }
// 17. A db/ mappában (a motor sémája) nincs házszó; a ház kezdő tartalma a hazak/<ház>/db/ alatt van.
for (const f of fajlok('db')) { const m = olv(f).match(/akvarell|szegf[uű]|zebegé|zebegeny|ernő|amrita|szonyi|szőnyi|bereny|berény|karpathy|kárpáthy|dunakan|visegrád|nagymaros|pilis/i); if (m) H('házszó a db/ alatt: „' + m[0] + '”', f); }
// 18. A nyitólap-sablonban, a kezelő kódjában és a stílusban nincs házszó (az index.html és az admin/index.html a sablonból generált: a ház adatai a haz.json „oldal” részében).
for (const f of ['motor/sablon/index.html', 'motor/sablon/admin.html', 'admin/admin.js', 'style.css']) { const m = olv(f).match(/akvarell|szegf[uű]|zebegé|zebegeny|ernő|amrita|szonyi|szőnyi|bereny|berény|karpathy|kárpáthy|dunakan|visegrád|nagymaros|pilis|csalog/i); if (m) H('házszó: „' + m[0] + '”', f); }
console.log(hiba, 'HIBA'); process.exit(hiba ? 1 : 0);
