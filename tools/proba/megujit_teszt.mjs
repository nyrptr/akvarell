// A belépés megújulásának próbája (adatbázis nélkül, egyszerű mintával): használat közben újra 90 nap, lejárt nem éled újra.
// Futtatás: node tools/proba/megujit_teszt.mjs
import { megujit, sha, SUTI, NAPOK, MEGUJIT_ALATT_NAP } from '../../functions/_kozos/belepes.js';
const T = 'a'.repeat(64), NAP = 864e5; let hiba = 0;
const jo = (n, ok, x = '') => { hiba += !ok; console.log(ok ? 'OK  ' : 'HIBA', n, ok ? '' : x); };
async function minta(maradNap) {
  const sorok = new Map(); sorok.set(await sha(T), { lejar: Date.now() + maradNap * NAP });
  const DB = { prepare(q) { return { bind(...a) { return {
    first: async () => (/^SELECT/.test(q) ? sorok.get(a[0]) || null : null),
    run: async () => { if (/^UPDATE/.test(q)) sorok.get(a[1]).lejar = a[0]; } }; } }; } };
  return { env: { DB }, sorok };
}
const kerés = (t) => ({ headers: { get: (n) => (n === 'cookie' && t ? `${SUTI}=${t}` : '') } });
let m = await minta(80), r = await megujit(kerés(T), m.env);
jo('80 napja van hátra: nem nyúl hozzá, nincs új süti', r && r.suti === null && r.lejar > Date.now() + 79 * NAP && r.lejar < Date.now() + 81 * NAP, JSON.stringify(r));
m = await minta(MEGUJIT_ALATT_NAP - 1); r = await megujit(kerés(T), m.env);
jo('59 napja van hátra: újra 90 nap, új süti', r && r.suti && r.lejar > Date.now() + (NAPOK - 1) * NAP && new RegExp(`Max-Age=${NAPOK * 86400}`).test(r.suti) && /HttpOnly/.test(r.suti) && /Secure/.test(r.suti) && /SameSite=Strict/.test(r.suti) && !/Domain=/i.test(r.suti), JSON.stringify(r));
jo('az adatbázisban is megnyúlt', [...m.sorok.values()][0].lejar > Date.now() + (NAPOK - 1) * NAP);
jo('ugyanaz a token marad (nem új belépés)', r.suti.startsWith(`${SUTI}=${T};`));
m = await minta(5); r = await megujit(kerés(T), m.env); jo('5 napja van hátra: megújul', r && r.suti && r.lejar > Date.now() + (NAPOK - 1) * NAP);
m = await minta(-1); r = await megujit(kerés(T), m.env); jo('lejárt belépés nem éled újra', r === null, JSON.stringify(r));
m = await minta(10); r = await megujit(kerés('b'.repeat(64)), m.env); jo('ismeretlen süti: nincs megújítás', r === null);
m = await minta(10); r = await megujit(kerés(''), m.env); jo('süti nélkül: nincs megújítás', r === null);
m = await minta(80); r = await megujit(kerés(T), m.env, true); jo('„Megújítom most”: 80 napnál is újra 90 nap', r && r.suti && r.lejar > Date.now() + (NAPOK - 1) * NAP);
process.exit(hiba ? 1 : 0);
