// ÚT: hírlevél szeletelve – csak a külön hozzájárulók kapják, 30-as szeletekben, mindenki pontosan egyszer, saját leiratkozó linkkel.
// Őrzi: hozzájárulás nélkül és leiratkozás után nincs levél; a próbalevél csak a házigazdának megy; nyelv szerinti szöveg; escape.
// A levél nem megy ki: LEVEL_PROBA=igen → a próba visszaolvassa (fut.mjs).
import { ok, vege, get, post, kezelo, levelek, cimrol } from './_kozos.mjs';
const TARGY = 'Őszi hétvége a Dunakanyarban', HU = 'Kedves vendégünk!\nNovemberben <b>csendes</b> a falu & szép a köd.', EN = 'Dear guest, November is quiet here.';

// 1. 37 kártya: 35 hozzájárul (ebből 5 angol), 1 nem járul hozzá, 1 hozzájárul, majd leiratkozik
const T = {};
for (let i = 1; i <= 35; i++) T[i] = (await post('/api/kartya', { nev: 'Próba ' + i, email: `v${i}@proba.test`, hirlevel: true, nyelv: i > 30 ? 'en' : 'hu' }, cimrol(i))).j.token;
await post('/api/kartya', { nev: 'Nem Kér', email: 'nemker@proba.test', hirlevel: false }, cimrol(36));
const le = (await post('/api/kartya', { nev: 'Le Iratkozó', email: 'leiratkozo@proba.test', hirlevel: true }, cimrol(37))).j.token;
ok(Object.values(T).every(t => /^[A-Za-z0-9_-]{16,64}$/.test(t || '')), '35 hozzájáruló kártya létrejött');
ok(/Leiratkoztál/.test((await get('/api/leiratkozas?t=' + le)).szoveg), 'egy vendég leiratkozik');

// 2. rossz bemenet; próbalevél csak a házigazdának
ok((await kezelo.post('hirlevel', { targy: 'x', hu: HU })).s === 400 && (await kezelo.post('hirlevel', { targy: TARGY, hu: 'rövid' })).s === 400, 'tárgy és szöveg nélkül nem megy (400)');
const p = await kezelo.post('hirlevel', { targy: TARGY, hu: HU, en: EN, proba: true });
let L = (await levelek()).filter(x => x.subject === TARGY);
ok(p.s === 200 && p.j.elkuldve === 1 && p.j.kov === null && L.length === 1 && L[0].to === 'gazda@proba.test', 'próbalevél: egy levél, csak a házigazdának', p.j);

// 3. első szelet: 30 levél, és megmondja, honnan kell folytatni
const s1 = await kezelo.post('hirlevel', { targy: TARGY, hu: HU, en: EN });
ok(s1.s === 200 && s1.j.elkuldve === 30 && s1.j.cimzett === 30 && s1.j.kov > 0, 'első szelet: 30 levél, van folytatás', s1.j);
// 4. második szelet: a maradék 5, nincs több
const s2 = await kezelo.post('hirlevel', { targy: TARGY, hu: HU, en: EN, tol: s1.j.kov });
ok(s2.s === 200 && s2.j.elkuldve === 5 && s2.j.kov === null, 'második szelet: a maradék 5 levél, vége', s2.j);
const s3 = await kezelo.post('hirlevel', { targy: TARGY, hu: HU, en: EN, tol: 999999 });
ok(s3.s === 200 && s3.j.elkuldve === 0 && s3.j.kov === null, 'a végén túl: 0 levél, nem hiba', s3.j);

// 5. ki kapta: mindenki pontosan egyszer, a nem kérő és a leiratkozott nem
L = (await levelek()).filter(x => x.subject === TARGY && x.to !== 'gazda@proba.test');
const db = {}; for (const x of L) db[x.to] = (db[x.to] || 0) + 1;
ok(L.length === 35 && Object.keys(db).length === 35 && Object.values(db).every(n => n === 1), 'a 35 hozzájáruló mind megkapta, pontosan egyszer', { levelek: L.length, cimek: Object.keys(db).length });
ok(!db['nemker@proba.test'] && !db['leiratkozo@proba.test'], 'aki nem járult hozzá vagy leiratkozott, nem kap levelet');

// 6. a levél tartalma: saját leiratkozó link, saját kártya, nyelv, escape
const egy = (cim) => L.find(x => x.to === cim).html;
ok(egy('v7@proba.test').includes('/api/leiratkozas?t=' + T[7]) && egy('v7@proba.test').includes('/#/kartya/' + T[7]), 'a levélben a címzett saját leiratkozó linkje és kártyája van');
ok(L.every(x => { const i = +x.to.match(/^v(\d+)@/)[1]; return Object.entries(T).every(([j, t]) => (+j === i) === x.html.includes(t)); }), 'egyik levélben sincs más vendég tokenje');
ok(egy('v3@proba.test').includes('Kedves vendégünk') && egy('v33@proba.test').includes('Dear guest') && !egy('v33@proba.test').includes('Kedves vendégünk'), 'magyar vendég magyar, angol vendég angol szöveget kap');
ok(egy('v3@proba.test').includes('&lt;b&gt;csendes&lt;/b&gt;') && egy('v3@proba.test').includes('&amp; szép') && !egy('v3@proba.test').includes('<b>csendes'), 'a szöveg escape-elve kerül a levélbe');

// 7. a levélből leiratkozó a következő körben már nem kap
await get('/api/leiratkozas?t=' + T[7]);
const TARGY2 = 'Téli nyitvatartás';
const k1 = await kezelo.post('hirlevel', { targy: TARGY2, hu: HU }), k2 = await kezelo.post('hirlevel', { targy: TARGY2, hu: HU, tol: k1.j.kov });
const L2 = (await levelek()).filter(x => x.subject === TARGY2);
ok(k1.j.elkuldve + k2.j.elkuldve === 34 && !L2.some(x => x.to === 'v7@proba.test'), 'a következő hírlevelet a leiratkozott már nem kapja (34 levél)', [k1.j, k2.j]);
ok(L2.find(x => x.to === 'v33@proba.test').html.includes('Kedves vendégünk'), 'angol szöveg nélkül az angol vendég a magyart kapja');
vege('hirlevel');
