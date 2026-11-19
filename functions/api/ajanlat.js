// POST /api/ajanlat – vendég ajánlatkérése. Ellenőrzés itt és az adatbázisban is.
import { J, NAP, ma } from '../_kozos/k.js';
export async function onRequestPost({ request, env }) {
  let d; try { d = await request.json(); } catch (e) { return J(400, { hiba: 'rossz kérés' }); }
  if (d.weboldal) return J(200, { ok: true });                      // csapda a robotoknak
  const s = (v, n) => String(v ?? '').trim().slice(0, n);
  const a = { apartman_id: s(d.apartman_id, 20), erkezes: s(d.erkezes, 10), tavozas: s(d.tavozas, 10), felnott: +d.felnott, gyerek: +d.gyerek || 0,
    nev: s(d.nev, 80), email: s(d.email, 120), telefon: s(d.telefon, 30) || null, uzenet: s(d.uzenet, 1000) || null, nyelv: d.nyelv === 'en' ? 'en' : 'hu' };
  if (!NAP.test(a.erkezes) || !NAP.test(a.tavozas) || a.tavozas <= a.erkezes || a.erkezes < ma()) return J(400, { hiba: 'dátum' });
  if (!(a.felnott >= 1 && a.felnott <= 3) || !(a.gyerek >= 0 && a.gyerek <= 2)) return J(400, { hiba: 'létszám' });
  if (a.nev.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) return J(400, { hiba: 'név vagy e-mail' });
  const db = env.DB;
  const fog = await db.prepare('SELECT COUNT(*) n FROM foglalt_nap WHERE apartman_id = ? AND nap >= ? AND nap < ?').bind(a.apartman_id, a.erkezes, a.tavozas).first();
  if (fog.n > 0) return J(409, { hiba: 'foglalt' });
  await db.prepare('INSERT INTO ajanlatkeres (apartman_id, erkezes, tavozas, felnott, gyerek, nev, email, telefon, uzenet, nyelv) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(a.apartman_id, a.erkezes, a.tavozas, a.felnott, a.gyerek, a.nev, a.email, a.telefon, a.uzenet, a.nyelv).run();
  return J(200, { ok: true });
}
