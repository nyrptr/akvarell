// ÚT: heti bejegyzés – AI nélkül készül a következő szombatra; vázlat → a kezelő kiteszi → megjelenik → leveszi → eltűnik.
// Őrzi: hetente egy bejegyzés (nem duplázódik), automatikus kitétel kapcsolható, a szabad apartmanok a foglalási naptárból jönnek,
// minden adat mellett forrás áll, két nyelv. Az időjárás külső forrás (met.no): ha a próba gépe nem éri el, a bejegyzés akkor is elkészül.
import { ok, vege, get, kezelo, nap } from './_kozos.mjs';
const adat0 = (await get('/api/adat')).j, aps = adat0.apartmanok;
// a következő szombat (ha ma szombat: a jövő heti), ahogy a szerver számolja
let i = 1; while (new Date(nap(i) + 'T12:00:00Z').getUTCDay() !== 6) i++;
const szo = nap(i), pen = nap(i - 1), vas = nap(i + 1);
const bl = async () => (await kezelo.get('blog')).j, kint = async () => (await get('/api/blog')).j;

// 1. automatikus kitétel kikapcsolva; egy apartman péntek–szombat éjszakára foglalt
ok((await kezelo.post('blog', { auto: false })).s === 200 && (await bl()).auto === false, 'automatikus kitétel kikapcsolva');
const foglalt = aps[0], szabadVart = aps.filter(a => a.id !== foglalt.id && !(adat0.foglalt || []).some(f => f.apartman_id === a.id && (f.nap === pen || f.nap === szo))).map(a => a.id);
ok((await kezelo.post('foglalt', { ap: foglalt.id, nap: pen, foglalt: true })).s === 200, `${foglalt.nev}: a hétvége péntekje foglalt`);

// 2. generálás: vázlat lesz, a vendégoldalon nincs
const g = await kezelo.post('blog/general', {});
ok(g.s === 200 && g.j.het === szo && g.j.allapot === 'vazlat', `bejegyzés készül a következő szombatra (${szo}), vázlatként`, g.j);
let B = await bl();
ok(B.bejegyzesek.length === 1 && B.bejegyzesek[0].het === szo && B.bejegyzesek[0].allapot === 'vazlat', 'a kezelőben egy vázlat');
ok((await kint()).length === 0, 'vázlat a vendégoldalon nem látszik');
const g2 = await kezelo.post('blog/general', {});
ok(g2.j.mar_van === true && (await bl()).bejegyzesek.length === 1, 'újra generálva nem duplázódik (hetente egy)');

// 3. a kezelő kiteszi → megjelenik, tartalma rendben
const id = B.bejegyzesek[0].id;
ok((await kezelo.post('blog', { id, allapot: 'barmi' })).s === 400, 'ismeretlen állapot → 400');
ok((await kezelo.post('blog', { id, allapot: 'kint' })).s === 200, 'a kezelő kiteszi');
const K = await kint(), b = K[0];
ok(K.length === 1 && b.het === szo && b.cim_hu && b.cim_en && b.cim_hu !== b.cim_en, 'a vendégoldalon megjelenik, magyar és angol címmel', K.map(x => x.cim_hu));
ok(Array.isArray(b.test_hu) && Array.isArray(b.test_en) && b.test_hu.length === b.test_en.length && b.test_hu.length >= 5, 'a szöveg bekezdésekre bontva, a két nyelv ugyanannyi részből áll', b.test_hu && b.test_hu.length);
ok(b.test_hu.every(x => Array.isArray(x) && ['p', 'h'].includes(x[0]) && typeof x[1] === 'string' && x[1].length > 1), 'minden rész címsor vagy bekezdés, üres nincs');
ok(/^\d{1,2}:\d{2}$/.test(b.adat.naplemente) && b.test_hu.some(x => x[1].includes(b.adat.naplemente)), 'naplemente számolva (óra:perc), a szövegben is ott van', b.adat.naplemente);
ok(Array.isArray(b.adat.forrasok) && b.adat.forrasok.length >= 3, 'az adatok forrása fel van sorolva', b.adat.forrasok);
ok(JSON.stringify(b.adat.szabad) === JSON.stringify(szabadVart) && !b.adat.szabad.includes(foglalt.id), 'a szabad apartmanok a foglalási naptárból: a foglalt nincs köztük', b.adat.szabad);
const ido = Object.keys(b.adat.ido || {}).length;
ok(ido === 0 ? !b.test_hu.some(x => x[1] === 'Időjárás') : b.test_hu.some(x => /met\.no/.test(x[1])), ido ? 'időjárás forrással (met.no)' : 'időjárás-adat nélkül nincs időjárás-rész (nem talál ki semmit)');
console.log(`  (megj.: időjárás-adat ${ido ? 'érkezett' : 'NEM érkezett – a külső forrás innen nem érhető el'})`);

// 4. leveszi → eltűnik; vissza → megjelenik
await kezelo.post('blog', { id, allapot: 'levett' });
ok((await kint()).length === 0, 'levéve: eltűnik a vendégoldalról');
await kezelo.post('blog', { id, allapot: 'kint' });
ok((await kint()).length === 1, 'újra kitéve: megjelenik');

// 5. automatikus kitétel visszakapcsolva; a vendégoldal lekérése nem készít második bejegyzést ugyanarra a hétre
ok((await kezelo.post('blog', { auto: true })).s === 200 && (await bl()).auto === true, 'automatikus kitétel visszakapcsolva');
await kint(); await new Promise(r => setTimeout(r, 1500));
ok((await bl()).bejegyzesek.length === 1, 'a vendégoldal lekérése sem duplázza a heti bejegyzést');
vege('blog');
