// POST /api/ajanlat – vendég ajánlatkérése. Ellenőrzés itt és az adatbázisban is.
import { J, NAP, ma } from '../_kozos/k.js';
import { kuld, keret, esc } from '../_kozos/level.js';
export async function onRequestPost({ request, env, waitUntil }) {
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
  // értesítés Ernőnek és visszaigazolás a vendégnek (ha a Brevo be van állítva); a válaszra nem vár
  const ap = await db.prepare('SELECT nev FROM apartman WHERE id = ?').bind(a.apartman_id).first();
  const sor = `${esc(ap ? ap.nev : a.apartman_id)} · ${a.erkezes} → ${a.tavozas} · ${a.felnott} felnőtt${a.gyerek ? ', ' + a.gyerek + ' gyerek' : ''}`;
  waitUntil(Promise.all([
    kuld(env, { to: env.ERTESITES_EMAIL, replyTo: a.email, subject: `Új foglalási kérés: ${ap ? ap.nev : ''} ${a.erkezes}`, html: keret('Új foglalási kérés', `<p>${sor}</p><p>${esc(a.nev)} · <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>${a.telefon ? ' · ' + esc(a.telefon) : ''}</p>${a.uzenet ? `<p style="white-space:pre-line">${esc(a.uzenet)}</p>` : ''}<p>Visszaigazolás a kezelőben: /admin/</p>`) }),
    kuld(env, { to: a.email, replyTo: env.ERTESITES_EMAIL, subject: a.nyelv === 'en' ? 'We have received your booking request – Akvarell' : 'Megkaptuk a foglalási kérésedet – Akvarell', html: keret(a.nyelv === 'en' ? 'Thank you for your request!' : 'Köszönjük a kérésedet!', `<p>${sor}</p><p>${a.nyelv === 'en' ? 'We will confirm by email shortly. Payment is due within 2 hours of confirmation.' : 'Hamarosan visszaigazoljuk e-mailben. A visszaigazolás után 2 órán belül kell fizetni.'}</p>`) }),
  ]).catch(() => { }));
  return J(200, { ok: true });
}
