// ÚT: visszatérő vendég – kártya vagy e-mail → kedvezmény a szerveren → az ár egyezik; a válasz nem árulja el, ki járt már itt.
// Őrzi: ár a szerveren (a böngésző kedvezménye nem számít), a kedvezmény felső határa, állapotváltás mindkét iránya (lemondás után nincs kedvezmény).
import { ok, vege, get, post, kezelo, nap, kovNap } from './_kozos.mjs';
import { arSzamol } from '../../../functions/_kozos/ar.js';
const ap = (await get('/api/adat')).j.apartmanok[0], k0 = kovNap(2);
const idopont = (het) => ({ erkezes: nap(k0 + 7 * het), tavozas: nap(k0 + 7 * het + 2) });   // kedd–csütörtök, hetente más
const kerQ = (het, email, nev, tobbi = {}) => post('/api/ajanlat', { apartman_id: ap.id, ...idopont(het), felnott: 2, gyerek: 0, nev, email, nyelv: 'hu', ...tobbi });
const sor = async (email) => (await kezelo.get('ajanlatok')).j.find(x => x.email === email);
const alap = (het) => { const s = arSzamol(ap, idopont(het).erkezes, idopont(het).tavozas, 2, 0); return { szallas: s.szallas, teljes: s.szallas + s.gyerek + s.egy - s.kedvezmeny }; };
const vart = (het, szazalek) => alap(het).teljes - Math.round(alap(het).szallas * szazalek / 100);

// 1. első foglalás és visszaigazolás: a vendég kártyát kap magától
ok((await kerQ(0, 'anna@proba.test', 'Próba Anna')).j.visszatero === false, 'első kérés: nem visszatérő');
const A1 = await sor('anna@proba.test');
ok(A1.visszatero === 0 && A1.ar_osszeg === alap(0).teljes, `első foglalás teljes áron (${alap(0).teljes} Ft)`, A1);
const vi = await kezelo.post('ajanlat', { id: A1.id, allapot: 'visszaigazolva' });
const kartya = (await get('/api/vendeg/' + vi.j.token)).j.kartya;
ok(/^[A-Za-z0-9_-]{16,64}$/.test(kartya || ''), 'visszaigazoláskor kártya jön létre, a vendégkönyvből elérhető');
const K = await get('/api/kartya/' + kartya);
ok(K.j.ottlet === 1 && K.j.kedvezmeny === 10, 'a kártyán 1 ottlét, 10%', K.j);

// 2. ugyanaz az e-mail, kártya nélkül: jár a kedvezmény, de a válasz nem árulja el
const a2 = await kerQ(1, 'anna@proba.test', 'Próba Anna');
ok(a2.s === 200 && a2.j.visszatero === false, 'e-mail alapján a válasz NEM mondja visszatérőnek (nem árulja el, ki járt itt)', a2.j);
const A2 = (await kezelo.get('ajanlatok')).j.find(x => x.email === 'anna@proba.test' && x.id !== A1.id);
ok(A2.visszatero === 1 && A2.ar_osszeg === vart(1, 10), `a szerver mégis levonja a 10%-ot (${vart(1, 10)} Ft)`, A2);

// 3. más e-mail, de érvényes kártyával: kedvezmény, és a válasz jelzi (a kártya az igazolás)
const b = await kerQ(2, 'bela@proba.test', 'Próba Béla', { kartya });
const Bs = await sor('bela@proba.test');
ok(b.j.visszatero === true && Bs.visszatero === 1 && Bs.ar_osszeg === vart(2, 10), 'kártyával: visszatérő, 10% levonva', Bs);

// 4. új vendég kártya nélkül; új kártya ottlét nélkül; a böngésző által „kért” kedvezmény nem számít
const c = await kerQ(3, 'cili@proba.test', 'Próba Cili', { ar: { szallas: 1, kedvezmeny: 999999 } });
const Cs = await sor('cili@proba.test');
ok(c.j.visszatero === false && Cs.visszatero === 0 && Cs.ar_osszeg === alap(3).teljes, 'új vendég: teljes ár, a böngésző kedvezménye nem számít', Cs);
const ujk = (await post('/api/kartya', { nev: 'Próba Dóra', email: 'dora@proba.test' })).j.token;
const d = await kerQ(4, 'dora@proba.test', 'Próba Dóra', { kartya: ujk });
ok(d.j.visszatero === false && (await sor('dora@proba.test')).ar_osszeg === alap(4).teljes, 'ottlét nélküli kártya: nincs kedvezmény');
ok((await kerQ(4, 'x@proba.test', 'Rossz Kártya', { kartya: 'z'.repeat(24) })).s !== 500, 'nem létező kártyatoken nem dönti el a kérést');

// 5. a tulaj átállítja a kedvezményt: a következő kérés már azzal számol; felső határ 50%
ok((await kezelo.post('beallitasok', { visszatero_kedvezmeny: '20' })).s === 200 && (await get('/api/kartya/' + kartya)).j.kedvezmeny === 20, 'a kezelőben 20%-ra állítva, a kártyán is 20%');
await kerQ(5, 'elek@proba.test', 'Próba Elek', { kartya });
ok((await sor('elek@proba.test')).ar_osszeg === vart(5, 20), `20%-kal számol (${vart(5, 20)} Ft)`);
await kezelo.post('beallitasok', { visszatero_kedvezmeny: '90' });
ok((await get('/api/kartya/' + kartya)).j.kedvezmeny === 50, '90%-ra állítva: a szerver 50%-nál megáll');
await kezelo.post('beallitasok', { visszatero_kedvezmeny: '10' });

// 6. visszafelé: az első foglalás lemondása után a kártya már nem ad kedvezményt
await kezelo.post('ajanlat', { id: A1.id, allapot: 'elutasitva' });
ok((await get('/api/kartya/' + kartya)).j.ottlet === 0, 'lemondás után a kártyán 0 ottlét');
const g = await kerQ(6, 'geza@proba.test', 'Próba Géza', { kartya });
ok(g.j.visszatero === false && (await sor('geza@proba.test')).ar_osszeg === alap(6).teljes, 'lemondás után a kártya nem ad kedvezményt');
vege('visszatero');
