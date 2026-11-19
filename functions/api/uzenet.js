// POST /api/uzenet – ajándékutalvány-kérés vagy kérdés. Ellenőrzés itt és az adatbázisban is.
import { J } from '../_kozos/k.js';
export async function onRequestPost({ request, env }) {
  let d; try { d = await request.json(); } catch (e) { return J(400, { hiba: 'rossz kérés' }); }
  if (d.weboldal) return J(200, { ok: true });
  const s = (v, n) => String(v ?? '').trim().slice(0, n);
  const a = { tipus: d.tipus === 'utalvany' ? 'utalvany' : 'kerdes', nev: s(d.nev, 80), email: s(d.email, 120), telefon: s(d.telefon, 30) || null, szoveg: s(d.szoveg, 2000) || null, nyelv: d.nyelv === 'en' ? 'en' : 'hu' };
  if (a.nev.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) return J(400, { hiba: 'név vagy e-mail' });
  await env.DB.prepare('INSERT INTO uzenet (tipus, nev, email, telefon, szoveg, nyelv) VALUES (?,?,?,?,?,?)').bind(a.tipus, a.nev, a.email, a.telefon, a.szoveg, a.nyelv).run();
  return J(200, { ok: true });
}
