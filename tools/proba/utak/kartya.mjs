// ÚT: vendégkártya – új, létező (e-mail megy, token nem), hírlevél-hozzájárulás és leiratkozás, házkód, kéréskorlát.
// Őrzi: a válasz nem ad ki személyes adatot és idegen kártyát (MODSZER 4/b), hozzájárulás időbélyeggel és visszavonható, korlát a nyilvános POST-on.
import { ok, vege, get, post, kezelo, levelek } from './_kozos.mjs';
const vendegek = async () => (await kezelo.get('vendegek')).j;
const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

// 1. rossz bemenet, robotcsapda
ok((await post('/api/kartya', { nev: 'A', email: 'a@proba.test' })).s === 400, 'egybetűs név → 400');
ok((await post('/api/kartya', { nev: 'Próba Anna', email: 'nem-email' })).s === 400, 'rossz e-mail → 400');
ok((await post('/api/kartya', { nev: 'Robot', email: 'robot@proba.test', weboldal: 'x' })).s === 200 && (await vendegek()).vendegek.length === 0, 'robotcsapda: 200, de nem jön létre kártya');
ok((await get('/api/kartya/' + 'x'.repeat(24))).s === 404 && (await get('/api/kartya/rovid')).s === 404, 'nem létező kártya → 404');

// 2. új kártya (1. számolt kérés)
const a = await post('/api/kartya', { nev: 'Próba Anna', email: 'Anna@Proba.Test', hirlevel: false });
ok(a.s === 200 && TOKEN.test(a.j.token || ''), 'új kártya: token jön', a);
ok(a.j && a.j.ottlet === 0 && a.j.kedvezmeny === 10 && a.j.hirlevel === false, 'új kártya: 0 ottlét, 10% (alapérték), hírlevél nincs', a.j);
ok(!/proba\.test/i.test(a.szoveg), 'a válaszban nincs e-mail-cím');
const k = await get('/api/kartya/' + a.j.token);
ok(k.s === 200 && k.j.nev === 'Próba Anna' && !/proba\.test/i.test(k.szoveg), 'a kártya megnyílik, e-mail nélkül', k);
ok(/no-store/.test(k.fej.get('cache-control') || '') && /noindex/.test(k.fej.get('x-robots-tag') || ''), 'a kártya nem gyorsítótárazható, nem indexelhető');
let V = await vendegek();
ok(V.vendegek.length === 1 && V.vendegek[0].email === 'anna@proba.test' && V.vendegek[0].hirlevel === 0 && !V.vendegek[0].hirlevel_ido, 'a kezelőben: kisbetűs cím, hozzájárulás nélkül', V.vendegek[0]);

// 3. létező címre: a token NEM jön vissza, levél megy a tulajdonosnak; 6 óránként legfeljebb 2 levél (2–4. kérés)
const m1 = await post('/api/kartya', { nev: 'Valaki Más', email: 'anna@proba.test' });
ok(m1.s === 200 && m1.j.mar_van === true && m1.j.elkuldve === true && !m1.szoveg.includes(a.j.token), 'létező cím: „már van”, a token nincs a válaszban', m1);
let L = (await levelek()).filter(x => x.to === 'anna@proba.test');
ok(L.length === 1 && L[0].html.includes('/#/kartya/' + a.j.token), 'a kártya linkje e-mailben megy a tulajdonosnak', L.map(x => x.subject));
await post('/api/kartya', { nev: 'Valaki Más', email: 'anna@proba.test' });
const m3 = await post('/api/kartya', { nev: 'Valaki Más', email: 'anna@proba.test' });
ok((await levelek()).filter(x => x.to === 'anna@proba.test').length === 2, 'harmadik kérésre nem megy harmadik levél (elárasztás ellen)');
ok(m3.s === 200 && m3.j.mar_van === true, 'a válasz ettől nem változik (nem árulja el a korlátot)', m3.j);
ok((await vendegek()).vendegek[0].nev === 'Próba Anna', 'idegen kérés nem írja át a kártya nevét');

// 4. hírlevél: külön hozzájárulás időbélyeggel; leiratkozás egy kattintással; a kártya megmarad (5. kérés)
const b = await post('/api/kartya', { nev: 'Próba Béla', email: 'bela@proba.test', hirlevel: true });
V = await vendegek(); const Bv = V.vendegek.find(x => x.email === 'bela@proba.test');
ok(b.j.hirlevel === true && Bv && Bv.hirlevel === 1 && !!Bv.hirlevel_ido, 'hírlevél-hozzájárulás időbélyeggel rögzítve', Bv);
let csv = (await kezelo.get('vendegek.csv')).szoveg;
ok(csv.includes('bela@proba.test') && !csv.includes('anna@proba.test'), 'a hírlevél-listában csak a hozzájáruló van');
ok(/Nem találjuk/.test((await get('/api/leiratkozas?t=' + 'y'.repeat(24))).szoveg), 'leiratkozás rossz tokennel: nem talál címet');
ok(/Leiratkoztál/.test((await get('/api/leiratkozas?t=' + b.j.token)).szoveg), 'leiratkozás a levél linkjéről');
V = await vendegek(); const B2 = V.vendegek.find(x => x.email === 'bela@proba.test');
ok(B2.hirlevel === 0 && !!B2.leiratkozva, 'leiratkozás után: hírlevél ki, időpont rögzítve', B2);
ok(!(await kezelo.get('vendegek.csv')).szoveg.includes('bela@proba.test'), 'a hírlevél-listából kikerült');
ok((await get('/api/kartya/' + b.j.token)).s === 200, 'a kártya leiratkozás után is él');

// 5. házkód (a szoba QR-kódja): aki a házból igényli, annak egy ottlét jár (6–8. kérés)
const kod = V.haz_kod;
ok(typeof kod === 'string' && kod.length >= 8, 'van házkód a kezelőben');
const c = await post('/api/kartya', { nev: 'Próba Cili', email: 'cili@proba.test', haz: kod });
ok(c.j.ottlet === 1, 'érvényes házkóddal: 1 ottlét', c.j);
const d = await post('/api/kartya', { nev: 'Próba Dóra', email: 'dora@proba.test', haz: 'rosszkod12' });
ok(d.j.ottlet === 0, 'rossz házkóddal: 0 ottlét', d.j);
const d2 = await post('/api/kartya', { nev: 'Próba Dóra', email: 'dora@proba.test', haz: kod });
ok(d2.j.mar_van === true && (await get('/api/kartya/' + d.j.token)).j.ottlet === 1, 'meglévő kártya a házból, érvényes kóddal: ottlét 0 → 1');
const uj = await kezelo.post('haz_kod', {});
ok(uj.s === 200 && uj.j.haz_kod && uj.j.haz_kod !== kod, 'a kezelő új házkódot kér: a régi lecserélődik');

// 6. kéréskorlát: egy címről óránként 8 kártyakérés (ez a 9.)
ok((await post('/api/kartya', { nev: 'Próba Elek', email: 'elek@proba.test' })).s === 429, 'a 9. kérés egy órán belül → 429');
ok(!(await vendegek()).vendegek.some(x => x.email === 'elek@proba.test'), 'a korlát után nem jön létre kártya');
vege('kartya');
