// Közös segédek a végigjátszott próbákhoz (tools/proba/utak/*.mjs). Minden út friss adatbázissal, helyi szerveren fut:
// indító: node tools/proba/utak/fut.mjs (minden út) vagy node tools/proba/utak/fut.mjs foglalas (egy út).
export const B = process.env.PROBA_URL || 'http://localhost:8788';
let hiba = 0, db = 0;
export function ok(feltetel, mit, reszlet) {
  db++;
  if (feltetel) console.log('  OK  ', mit);
  else { hiba++; console.log('  HIBA', mit, reszlet === undefined ? '' : '→ ' + (typeof reszlet === 'string' ? reszlet : JSON.stringify(reszlet)).slice(0, 400)); }
}
export function vege(nev) { console.log(`${nev}: ${db} lépés, ${hiba} HIBA`); process.exit(hiba ? 1 : 0); }
async function hiv(ut, m, test) {
  const r = await fetch(B + ut, { method: m, headers: test === undefined ? {} : { 'content-type': 'application/json' }, body: test === undefined ? undefined : JSON.stringify(test) });
  const szoveg = await r.text(); let j = null; try { j = JSON.parse(szoveg); } catch (e) { }
  return { s: r.status, j, szoveg, fej: r.headers };
}
export const get = (ut) => hiv(ut, 'GET');
export const post = (ut, test) => hiv(ut, 'POST', test);
export const kezelo = { get: (ut) => hiv('/admin/api/' + ut, 'GET'), post: (ut, test) => hiv('/admin/api/' + ut, 'POST', test) };
export const levelek = async () => (await kezelo.get('proba/levelek')).j || [];   // LEVEL_PROBA=igen: a ki nem küldött levelek
// nap a mai naphoz képest (ÉÉÉÉ-HH-NN, UTC dél: nyári/téli időszámítás nem tolja el)
export function nap(plusz) { const d = new Date(); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() + plusz); return d.toISOString().slice(0, 10); }
// a következő adott hétköznap (0 = vasárnap … 6 = szombat) legalább `tol` nap múlva
export function kovNap(het, tol = 60) { for (let i = tol; ; i++) if (new Date(nap(i) + 'T12:00:00Z').getUTCDay() === het) return i; }
