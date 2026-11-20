// ÚT: foglalás → ütközés (409) → visszaigazolás → vendégkönyv-link → pénz-sor → lemondás (napok felszabadulnak, pénz-sor eltűnik).
// Őrzi: ár a szerveren (ATNEZES 2.), bemenet-ellenőrzés (4.), dupla foglalás elleni zár, visszavonás felszabadít (5.), a válasz nem ad ki személyes adatot.
import { ok, vege, get, post, kezelo, levelek, nap, kovNap } from './_kozos.mjs';
import { arSzamol } from '../../../functions/_kozos/ar.js';

const adat = (await get('/api/adat')).j, ap = adat.apartmanok[0];
ok(!!ap, 'van apartman a friss adatbázisban');
const k = kovNap(2), erk = nap(k), tav = nap(k + 2), ho = erk.slice(0, 7);   // kedd–csütörtök, két éj, 2 hónapon túl
const keres = (email, nev, tobbi = {}) => ({ apartman_id: ap.id, erkezes: erk, tavozas: tav, felnott: 2, gyerek: 0, nev, email, nyelv: 'hu', ...tobbi });
const napok = async () => ((await kezelo.get(`foglalt?ap=${ap.id}&ho=${ho}`)).j || []).filter(x => x.nap >= erk && x.nap < tav);

// 1. rossz bemenet nem megy át
ok((await post('/api/ajanlat', keres('x@proba.test', 'Rossz Dátum', { erkezes: erk.slice(0, 8) + '32' }))).s === 400, 'nem létező dátum → 400');
ok((await post('/api/ajanlat', keres('x@proba.test', 'Sok Felnőtt', { felnott: 4 }))).s === 400, '4 felnőtt → 400');
ok((await post('/api/ajanlat', keres('x@proba.test', 'Múlt', { erkezes: nap(-3), tavozas: nap(-1) }))).s === 400, 'múltbeli dátum → 400');
ok((await post('/api/ajanlat', keres('x@proba.test', 'Hosszú', { tavozas: nap(k + 40) }))).s === 400, '30 éjnél hosszabb → 400');
ok((await post('/api/ajanlat', keres('nem-email', 'Rossz Cím'))).s === 400, 'rossz e-mail → 400');
ok((await post('/api/ajanlat', keres('x@proba.test', 'Nincs Ilyen', { apartman_id: 'nincs' }))).s === 400, 'nem létező apartman → 400');
const robot = await post('/api/ajanlat', keres('robot@proba.test', 'Robot', { weboldal: 'http://x' }));
ok(robot.s === 200 && ((await kezelo.get('ajanlatok')).j || []).length === 0, 'robotcsapda: 200, de nem kerül be semmi');

// 2. A foglalási kérés; a böngésző 1 Ft-os árat küld, a szerver maga számol
const a = await post('/api/ajanlat', keres('anna@proba.test', 'Próba Anna', { telefon: '+36 30 000 0000', ar: { szallas: 1 } }));
ok(a.s === 200 && a.j.ok === true, 'A kérés bekerül (200)', a);
ok(a.j && a.j.visszatero === false, 'a válasz nem mondja visszatérőnek');
let lista = (await kezelo.get('ajanlatok')).j, A = lista.find(x => x.email === 'anna@proba.test');
const sz = arSzamol(ap, erk, tav, 2, 0), vart = sz.szallas + sz.gyerek + sz.egy - sz.kedvezmeny;
ok(A && A.allapot === 'uj', 'A a kezelőben, állapota: új');
ok(A && A.ar_osszeg === vart && vart > 1000, `az ár a szerveren számolt (${vart} Ft), nem a böngésző 1 Ft-ja`, A && A.ar_osszeg);
ok((await napok()).length === 0, 'visszaigazolás előtt a napok szabadok');
let L = await levelek();
ok(L.some(x => x.to === 'anna@proba.test') && L.some(x => x.to === 'gazda@proba.test'), 'levél a vendégnek és a tulajnak (próba-levelező)', L.map(x => x.to));

// 3. B ugyanarra az időre: amíg A nincs visszaigazolva, bekerül
const b = await post('/api/ajanlat', keres('bela@proba.test', 'Próba Béla'));
ok(b.s === 200, 'B kérés ugyanarra az időre bekerül (még nincs foglalt nap)', b);
const Bk = (await kezelo.get('ajanlatok')).j.find(x => x.email === 'bela@proba.test');

// 4. A visszaigazolása: napok lefoglalva, vendégkönyv-link, pénz-sor, levél
const vi = await kezelo.post('ajanlat', { id: A.id, allapot: 'visszaigazolva' });
ok(vi.s === 200 && /^[A-Za-z0-9_-]{20,64}$/.test(vi.j.token || ''), 'A visszaigazolva, vendégkönyv-token jön', vi);
ok(vi.j && vi.j.level === 'elküldve', 'visszaigazoló levél elment', vi.j && vi.j.level);
ok((await napok()).length === 2 && (await napok()).every(x => x.forras === 'ajanlat'), 'a két éj lefoglalva');
ok(((await get('/api/adat')).j.foglalt || []).filter(x => x.apartman_id === ap.id && x.nap >= erk && x.nap < tav).length === 2, 'a vendégoldal naptára is foglaltnak mutatja');
const ev = erk.slice(0, 4), penzA = async () => ((await kezelo.get('penz?ev=' + ev)).j.sorok || []).filter(x => x.ajanlat_id === A.id);
let P = await penzA();
ok(P.some(x => x.tipus === 'bevetel' && x.kategoria === 'szallas' && x.osszeg === vart && x.auto === 1), 'pénz-sor: bevétel, szállás, a számolt összeggel', P);
ok((await kezelo.post('ajanlat', { id: A.id, allapot: 'visszaigazolva' })).s === 200 && (await penzA()).length === P.length, 'újra visszaigazolva a pénz-sor nem duplázódik');
L = await levelek();
ok(L.filter(x => x.to === 'anna@proba.test' && /isszaigazol/.test(x.subject)).length === 1, 'visszaigazoló levél pontosan egyszer');
ok(L.some(x => x.html.includes(vi.j.token)), 'a levélben benne van a vendégkönyv-link');

// 5. ütközés: B nem igazolható vissza, új kérés 409
const ub = await kezelo.post('ajanlat', { id: Bk.id, allapot: 'visszaigazolva' });
ok(ub.s === 409 && (ub.j.napok || []).length === 2, 'B visszaigazolása → 409, a napok felsorolva', ub);
ok((await post('/api/ajanlat', keres('cili@proba.test', 'Próba Cili'))).s === 409, 'új kérés a foglalt napokra → 409');
ok((await post('/api/ajanlat', keres('cili@proba.test', 'Próba Cili', { erkezes: nap(k + 1), tavozas: nap(k + 3) }))).s === 409, 'részben átfedő kérés → 409');
ok((await post('/api/ajanlat', keres('dora@proba.test', 'Próba Dóra', { erkezes: tav, tavozas: nap(k + 3) }))).s === 200, 'a távozás napján kezdődő kérés belefér (200)');

// 6. vendégkönyv: megnyílik, de nem ad vissza e-mailt, telefont; a wifi és a bejutás az időablakon kívül nincs benne
const vk = await get('/api/vendeg/' + vi.j.token);
ok(vk.s === 200 && vk.j.foglalas.erkezes === erk, 'a vendégkönyv megnyílik a titkos linkkel', vk);
ok(!/anna@proba\.test|000 0000/.test(vk.szoveg), 'a vendégkönyv válaszában nincs e-mail, telefon');
ok(vk.j && vk.j.nyitva === false && !('wifi_jelszo' in vk.j.vk) && !('bejutas_hu' in vk.j.vk), 'érkezés előtt 2 napnál korábban nincs wifi-jelszó, bejutás');
ok((await get('/api/vendeg/' + 'x'.repeat(32))).s === 404, 'rossz token → 404');

// 7. lemondás: napok felszabadulnak, pénz-sor eltűnik, vendégkönyv bezár, B visszaigazolható
const le = await kezelo.post('ajanlat', { id: A.id, allapot: 'elutasitva' });
ok(le.s === 200, 'A lemondva (elutasítva)', le);
ok((await napok()).length === 0, 'a napok felszabadultak');
ok((await penzA()).length === 0, 'A pénz-sorai eltűntek');
ok((await get('/api/vendeg/' + vi.j.token)).s === 404, 'a lemondott foglalás vendégkönyve bezárt (404)');
const vb = await kezelo.post('ajanlat', { id: Bk.id, allapot: 'visszaigazolva' });
ok(vb.s === 200 && (await napok()).length === 2, 'B most visszaigazolható, a napok újra foglaltak', vb);

// 8. két visszaigazolt foglalás fedi ugyanazt a napot („mégis”): az egyik lemondása nem szabadítja fel a másikét
const vm = await kezelo.post('ajanlat', { id: A.id, allapot: 'visszaigazolva', megis: true });
ok(vm.s === 200, 'A „mégis” visszaigazolva B mellé', vm);
await kezelo.post('ajanlat', { id: A.id, allapot: 'elutasitva' });
ok((await napok()).length === 2, 'A lemondása után B napjai foglaltak maradnak');
vege('foglalas');
