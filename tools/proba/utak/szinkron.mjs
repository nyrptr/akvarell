// ÚT: friss naptár-szinkron visszaigazolás előtt (szinkron egy apartmanra), elavult-jelzés, hibánál a régi napok maradnak.
// Önálló egységpróba: memóriás SQLite a valódi sémával, a portál (iCal) lekérését kicseréli; a helyi szerver nem kell hozzá.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { ok, vege, nap } from './_kozos.mjs';
import { szinkron, elavult } from '../../../functions/_kozos/naptar.js';

const sql = new DatabaseSync(':memory:');
sql.exec(readFileSync(new URL('../../../db/schema.sql', import.meta.url), 'utf8'));
const prep = (q) => { const st = sql.prepare(q); let a = []; const o = {
  bind: (...x) => { a = x; return o; }, first: async () => st.get(...a) || null, all: async () => ({ results: st.all(...a) }), run: async () => { const r = st.run(...a); return { meta: { last_row_id: Number(r.lastInsertRowid) } }; } }; return o; };
const env = { DB: { prepare: prep, batch: async (l) => { for (const x of l) await x.run(); return []; } } };
sql.exec("INSERT INTO apartman (id,sorrend,nev,ar_hetkoznap,ar_hetvege,ar3_hetkoznap,ar3_hetvege) VALUES ('a',1,'A',1,1,1,1),('b',2,'B',1,1,1,1)");
const ics = (...napok) => 'BEGIN:VCALENDAR\r\n' + napok.map(n => `BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:${n.replace(/-/g, '')}\r\nEND:VEVENT\r\n`).join('') + 'END:VCALENDAR';
const n1 = nap(10), n2 = nap(11);
let elerheto = true, kert = [];
globalThis.fetch = async (u) => { kert.push(u); if (!elerheto) throw new Error('timeout'); return { ok: true, text: async () => ics(u.includes('/a') ? n1 : n2) }; };
const beall = (k, v) => sql.prepare('INSERT OR REPLACE INTO beallitas (kulcs, ertek) VALUES (?, ?)').run(k, v);
beall('ical_a', 'https://portal.test/a.ics'); beall('ical_b', 'https://portal.test/b.ics');
const foglalt = (ap) => sql.prepare("SELECT nap FROM foglalt_nap WHERE apartman_id = ? AND forras = 'ical' ORDER BY nap").all(ap).map(x => x.nap);

// 1. teljes szinkron: mindkét apartman
let r = await szinkron(env, true);
ok(r.a.ok && r.b.ok && !!r.a.ido, 'teljes szinkron: mindkét apartman rendben, időpecséttel', r);
ok(foglalt('a')[0] === n1 && foglalt('b')[0] === n2, 'a portál napjai bekerültek apartmanonként');

// 2. egy apartman friss lekérése: csak az az egy hívás megy, a másik eredménye érintetlen
kert = []; r = await szinkron(env, true, 'a');
ok(kert.length === 1 && kert[0].includes('/a'), 'visszaigazolás előtt csak az érintett apartman naptárát kéri le', kert);
ok(r.b && r.b.ok && !r.hiba_ap, 'a másik apartman eredménye megmarad, nincs hiba');

// 3. a portál nem érhető el: hiba jelzése, a régi napok maradnak, az utolsó sikeres idő megvan
elerheto = false; r = await szinkron(env, true, 'a');
ok(!!r.hiba_ap && r.hiba_ap.ok === false && !!r.hiba_ap.utolso_ok, 'portálhiba: hiba_ap jelzi, az utolsó sikeres idővel', r.hiba_ap);
ok(foglalt('a')[0] === n1, 'hibánál a régi napok maradnak (nem szabadul fel semmi)');
ok(foglalt('b')[0] === n2, 'a másik apartman napjai érintetlenek');
const rr = await szinkron(env, true, 'a');
ok(rr.hiba_ap && rr.hiba_ap.utolso_ok === r.hiba_ap.utolso_ok, 'ismételt hibánál az utolsó sikeres idő nem vész el');

// 4. elavult-jelzés
const most = Date.now(), perc = (p) => most - p * 60e3;
ok(elavult({ a: { ok: true, ido: perc(20) } }, ['a'], most).length === 0, 'friss szinkron: nincs jelzés');
ok(elavult({ a: { ok: true, ido: perc(200) } }, ['a'], most)[0] === 'a', '3 óránál régebbi: jelzés');
ok(elavult({ a: { ok: false, hiba: 'x', utolso_ok: perc(30) } }, ['a'], most).length === 0, 'friss hiba, de 30 perce még sikerült: még nincs jelzés');
ok(elavult({ a: { ok: false, hiba: 'x', utolso_ok: null } }, ['a'], most)[0] === 'a', 'sosem sikerült: jelzés');
ok(elavult({}, ['a'], most).length === 0, 'még nem futott szinkron: nincs mit jelezni');
vege('szinkron');
