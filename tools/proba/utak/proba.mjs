// ÚT: próbafoglalás → a valódi utat bejárja, de nem foglal valódi napot, nincs pénz-sor, nem iCal, nem számít visszatérőnek, csak a gazdának megy levél.
// Őrzi: a próba nem ronthatja az éles adatot (napok, pénz, kedvezmény, naptár-kivitel), és törölhető.
import { ok, vege, get, post, kezelo, levelek, nap } from './_kozos.mjs';

const adat = (await get('/api/adat')).j, ap = adat.apartmanok[0];
const lista = async () => (await kezelo.get('ajanlatok')).j || [];
const foglaltNapok = async (erk, tav) => ((await get('/api/adat')).j.foglalt || []).filter(x => x.apartman_id === ap.id && x.nap >= erk && x.nap < tav);

// 1. a próba létrejön, jelölve, a gazdának megy a levél
const r = await kezelo.post('proba', { apartman_id: ap.id });
ok(r.s === 200 && r.j.ok && r.j.id > 0, 'próbafoglalás létrejön', r);
let P = (await lista()).find(x => x.id === r.j.id);
ok(P && P.proba === 1 && P.allapot === 'uj', 'a kezelő listájában PRÓBA jelzéssel, állapota: új', P);
const erk = P.erkezes, tav = P.tavozas, ho = erk.slice(0, 7);
let L = await levelek();
ok(L.some(x => x.to === 'gazda@proba.test' && /\[PRÓBA\]/.test(x.subject)), 'a [PRÓBA] levél a gazdának megy', L.map(x => x.subject));
ok(L.every(x => x.to === 'gazda@proba.test'), 'más címre nem megy levél', L.map(x => x.to));

// 2. visszaigazolás: vendégkönyv-link jön, de nincs valódi foglalt nap, pénz-sor, vendégkártya
const vi = await kezelo.post('ajanlat', { id: P.id, allapot: 'visszaigazolva' });
ok(vi.s === 200 && /^[A-Za-z0-9_-]{20,64}$/.test(vi.j.token || ''), 'a próba visszaigazolható, vendégkönyv-token jön', vi);
ok((await foglaltNapok(erk, tav)).length === 0, 'a vendégoldal naptárában nincs foglalt nap');
ok(((await kezelo.get(`foglalt?ap=${ap.id}&ho=${ho}`)).j || []).filter(x => x.nap >= erk && x.nap < tav).length === 0, 'a kezelő naptárában sincs foglalt nap');
const ics = (await get('/ical/' + ap.id + '.ics')).szoveg;
ok(!ics.includes('DTSTART;VALUE=DATE:' + erk.replace(/-/g, '')), 'az iCal-kivitelben nincs benne');
const ev = erk.slice(0, 4), penz = ((await kezelo.get('penz?ev=' + ev)).j.sorok || []).filter(x => x.ajanlat_id === P.id);
ok(penz.length === 0, 'nincs pénz-sor');
ok((((await kezelo.get('vendegek')).j || {}).vendegek || []).every(x => x.email !== 'gazda@proba.test'), 'nem lesz vendégkártya a próbából');

// 3. a próba nem teszi visszatérővé a gazda címét, és nem foglalja el a valódi kérés napjait
const val = await post('/api/ajanlat', { apartman_id: ap.id, erkezes: erk, tavozas: tav, felnott: 2, gyerek: 0, nev: 'Valódi Vendég', email: 'gazda@proba.test', nyelv: 'hu' });
ok(val.s === 200, 'ugyanarra az időre valódi kérés bejön (a próba nem foglal), nem 409', val);
const V = (await lista()).find(x => x.nev === 'Valódi Vendég');
ok(V && V.visszatero === 0, 'a próba után a valódi kérés nem visszatérő', V);
const vv = await kezelo.post('ajanlat', { id: V.id, allapot: 'visszaigazolva' });
ok(vv.s === 200 && (await foglaltNapok(erk, tav)).length === 2, 'a valódi kérés visszaigazolva: a két éj lefoglalva (próba nem zavarja)', vv);
await kezelo.post('ajanlat', { id: P.id, allapot: 'elutasitva' });
ok((await foglaltNapok(erk, tav)).length === 2, 'a próba lemondása nem szabadítja fel a valódi foglalás napjait');

// 4. a próbák törölhetők, a valódi marad
const t = await kezelo.post('proba', { torol: true });
const utan = await lista();
ok(t.s === 200 && !utan.some(x => x.proba) && utan.some(x => x.nev === 'Valódi Vendég'), 'a próbák törlődnek, a valódi kérés megmarad', utan.map(x => [x.nev, x.proba]));
ok((await get('/api/vendeg/' + vi.j.token)).s === 404, 'a törölt próba vendégkönyve bezárt (404)');
vege('proba');
