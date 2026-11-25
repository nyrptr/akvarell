// ÚT: vendégkönyv – wifi és bejutás csak az időablakban, kérés a házigazdának, saját értékelés → a kezelő kiteszi → a vendégoldalon megjelenik.
// Őrzi: időablak (érkezés előtt 2 nappal nyílik), a válasz nem ad ki e-mailt és telefont, értékelés csak érkezés után és foglalásonként egy,
// csak a keresztnév jelenik meg, a szöveg nyersen tárolódik (az oldal escape-eli), kéréskorlát, a kezelő visszavonhatja a kitett értékelést.
import { ok, vege, get, post, kezelo, levelek, nap, kovNap } from './_kozos.mjs';

const adat = (await get('/api/adat')).j;
const szabad = (ap, e, t) => !(adat.foglalt || []).some(x => x.apartman_id === ap.id && x.nap >= e && x.nap < t);
const ma = nap(0), holnaputan = nap(2), k = kovNap(2), tav1 = nap(k), tav2 = nap(k + 2);
const ap = adat.apartmanok.find(a => szabad(a, ma, holnaputan) && szabad(a, tav1, tav2));
ok(!!ap, 'van apartman, amely ma és két hónap múlva is szabad');
const fogl = async (email, nev, erkezes, tavozas, nyelv = 'hu') => {
  const r = await post('/api/ajanlat', { apartman_id: ap.id, erkezes, tavozas, felnott: 2, gyerek: 0, nev, email, telefon: '+36 30 111 2222', nyelv });
  const s = ((await kezelo.get('ajanlatok')).j || []).find(x => x.email === email);
  const v = s ? await kezelo.post('ajanlat', { id: s.id, allapot: 'visszaigazolva' }) : { j: {} };
  return { keres: r, sor: s, token: v.j && v.j.token };
};

// 1. a házigazda kitölti a vendégkönyv tudnivalóit
ok((await kezelo.post('vendegkonyv', { ertekeles_link: 'http://nem-biztonsagos.test' })).s === 400, 'értékelés-link csak https:// lehet (400)');
const TITOK = 'Titkos-Wifi-9431', BEJUT = 'Kulcsszéf kódja 4471 a kapunál';
const be = await kezelo.post('vendegkonyv', { tel: '+36 27 000 000', wifi_nev: 'Proba-Haz', wifi_jelszo: TITOK, bejutas_hu: BEJUT, bejutas_en: 'Key safe 4471', parkolas_hu: 'Az udvarban', ertekeles_link: 'https://g.page/r/proba' });
ok(be.s === 200, 'a kezelő menti a vendégkönyv tudnivalóit', be);

// 2. A: ma érkezik → az időablak nyitva
const A = await fogl('anna@proba.test', 'Próba Anna', ma, holnaputan);
ok(A.keres.s === 200 && /^[A-Za-z0-9_-]{20,64}$/.test(A.token || ''), 'A (ma érkezik) visszaigazolva, vendégkönyv-token jön', A.keres);
const va = await get('/api/vendeg/' + A.token);
ok(va.s === 200 && va.j.nyitva === true, 'A vendégkönyve nyitva');
ok(va.j && va.j.vk.wifi_jelszo === TITOK && va.j.vk.bejutas_hu === BEJUT, 'nyitva: wifi-jelszó és bejutás látszik', va.j && va.j.vk);
ok(!/anna@proba\.test|111 2222/.test(va.szoveg), 'a válaszban nincs a vendég e-mailje, telefonja');
ok(/no-store/.test(va.fej.get('cache-control') || '') && /noindex/.test(va.fej.get('x-robots-tag') || ''), 'nem gyorsítótárazható, nem indexelhető');

// 3. B: két hónap múlva érkezik → zárva: se wifi, se bejutás
const Bv = await fogl('bela@proba.test', 'Béla Proba', tav1, tav2, 'en');
const vb = await get('/api/vendeg/' + Bv.token);
ok(vb.s === 200 && vb.j.nyitva === false, 'B vendégkönyve megnyílik, de az időablak zárva');
ok(!vb.szoveg.includes(TITOK) && !vb.szoveg.includes('4471'), 'zárva: a wifi-jelszó és a bejutás sehol nincs a válaszban');
ok(vb.j && vb.j.vk.parkolas_hu === 'Az udvarban' && vb.j.vk.ertekeles_link === 'https://g.page/r/proba', 'zárva is látszik: parkolás, értékelés-link (mindenkinek, jutalom nélkül)');

// 4. kérés a házigazdának
ok((await post('/api/vendeg/' + A.token, { tipus: 'egyeb', szoveg: '' })).s === 400, 'üres üzenet → 400');
ok((await post('/api/vendeg/' + 'x'.repeat(32), { tipus: 'kesoi' })).s === 404, 'rossz tokennel nem lehet kérni (404)');
const kq = await post('/api/vendeg/' + A.token, { tipus: 'kesoi', szoveg: '12 óráig maradnánk <b>ha lehet</b>' });
ok(kq.s === 200, 'késői távozás kérése elmegy', kq);
const U = ((await kezelo.get('uzenetek')).j || []).find(x => x.email === 'anna@proba.test');
ok(U && U.szoveg.includes('Késői távozás') && U.szoveg.includes(ap.nev) && U.szoveg.includes('<b>ha lehet</b>'), 'a kezelő Üzenetek fülén megjelenik (típus, apartman, nyers szöveg)', U);
const L = (await levelek()).filter(x => x.to === 'gazda@proba.test' && /Vendégkérés/.test(x.subject));
ok(L.length === 1 && L[0].replyTo === 'anna@proba.test' && L[0].html.includes('&lt;b&gt;') && !L[0].html.includes('<b>ha lehet'), 'levél a házigazdának: válaszcím a vendég, a szöveg escape-elve', L.map(x => x.subject));

// 5. értékelés: csak érkezés után, 1–10, foglalásonként egy
ok((await post('/api/vendeg/' + Bv.token, { tipus: 'ertekeles', pont: 10 })).s === 400, 'B még nem érkezett: nem értékelhet (400)');
ok((await post('/api/vendeg/' + A.token, { tipus: 'ertekeles', pont: 11 })).s === 400 && (await post('/api/vendeg/' + A.token, { tipus: 'ertekeles', pont: 0 })).s === 400, 'pont csak 1–10 (400)');
const SZ = 'Szép volt <script>alert(1)</script> & csendes';
ok((await post('/api/vendeg/' + A.token, { tipus: 'ertekeles', pont: 7, szoveg: 'első' })).s === 200, 'A értékel (7 pont)');
ok((await post('/api/vendeg/' + A.token, { tipus: 'ertekeles', pont: 9, szoveg: SZ })).s === 200, 'A újra értékel (9 pont)');
let E = (await kezelo.get('ertekelesek')).j;
ok(E.length === 1 && E[0].pont === 9 && E[0].allapot === 'uj', 'foglalásonként egy értékelés: a második felülírja, állapota „új”', E);
ok(E[0] && E[0].nev === 'Anna', 'csak a keresztnév tárolódik megjelenítésre (magyar sorrend: utolsó szó)', E[0] && E[0].nev);
ok(((await get('/api/adat')).j.ertekelesek || []).length === 0, 'amíg a kezelő nem teszi ki, a vendégoldalon nincs');
ok((await kezelo.get('ma')).j.ertekeles === 1, 'a kezelő Ma lapja jelzi az új értékelést');

// 6. a kezelő kiteszi → megjelenik; visszaveszi → eltűnik
ok((await kezelo.post('ertekeles', { id: E[0].id, allapot: 'kint' })).s === 200, 'a kezelő kiteszi');
let P = (await get('/api/adat')).j;
ok(P.ertekelesek.length === 1 && P.ertekelesek[0].nev === 'Anna' && P.ertekelesek[0].pont === 9 && P.ertekelesek[0].szoveg === SZ, 'a vendégoldal adatában megjelenik, a szöveg nyersen (az oldal escape-eli)', P.ertekelesek);
ok(P.sajat_ert && P.sajat_ert.db === 1 && P.sajat_ert.atlag === 9, 'saját átlag: 1 értékelés, 9,0');
ok(!JSON.stringify(P.ertekelesek).includes('proba.test') && !JSON.stringify(P.ertekelesek).includes('Próba'), 'a nyilvános értékelésben nincs e-mail, vezetéknév');
ok((await post('/api/vendeg/' + A.token, { tipus: 'ertekeles', pont: 3, szoveg: 'átírom' })).s === 200 && ((await get('/api/adat')).j.ertekelesek || []).length === 0, 'ha a vendég átírja, újra jóvá kell hagyni (lekerül)');
E = (await kezelo.get('ertekelesek')).j;
await kezelo.post('ertekeles', { id: E[0].id, allapot: 'kint' });
ok((await kezelo.post('ertekeles', { id: E[0].id, allapot: 'rejtett' })).s === 200 && ((await get('/api/adat')).j.ertekelesek || []).length === 0, 'a kezelő visszaveszi: eltűnik a vendégoldalról');
ok((await kezelo.post('ertekeles', { id: E[0].id, allapot: 'barmi' })).s === 400, 'ismeretlen állapot → 400');

// 7. korlát és lemondás
for (let i = 0; i < 2; i++) await post('/api/vendeg/' + A.token, { tipus: 'ertekeles', pont: 8 });
ok((await post('/api/vendeg/' + A.token, { tipus: 'ertekeles', pont: 8 })).s === 429, 'a 6. értékelés-küldés egy órán belül → 429');
for (let i = 0; i < 5; i++) await post('/api/vendeg/' + A.token, { tipus: 'reggeli' });
ok((await post('/api/vendeg/' + A.token, { tipus: 'reggeli' })).s === 429, 'a 7. kérés egy órán belül → 429');
await kezelo.post('ajanlat', { id: A.sor.id, allapot: 'elutasitva' });
ok((await get('/api/vendeg/' + A.token)).s === 404 && (await post('/api/vendeg/' + A.token, { tipus: 'kesoi' })).s === 404, 'lemondás után a vendégkönyv bezár: se olvasni, se kérni');
vege('vendegkonyv');
