// POST /api/ajanlat – vendég ajánlatkérése. Ellenőrzés itt és az adatbázisban is.
import { J, NAP, ma } from '../_kozos/k.js';
import { kuld, keret, esc } from '../_kozos/level.js';
import { vendegMent, ottletek, beall, szazalek } from '../_kozos/vendeg.js';
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
  const be = await db.prepare('INSERT INTO ajanlatkeres (apartman_id, erkezes, tavozas, felnott, gyerek, nev, email, telefon, uzenet, nyelv) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(a.apartman_id, a.erkezes, a.tavozas, a.felnott, a.gyerek, a.nev, a.email, a.telefon, a.uzenet, a.nyelv).run();
  const id = be.meta.last_row_id;
  // visszatérő vendég: érvényes vendégkártya, vagy korábbi visszaigazolt foglalás ugyanezzel az e-mail-címmel
  const kartya = /^[A-Za-z0-9_-]{16,64}$/.test(d.kartya || '') ? await db.prepare('SELECT email FROM vendeg WHERE token = ?').bind(d.kartya).first() : null;
  const visszatero = (await ottletek(db, a.email)) > 0 || (kartya && (await ottletek(db, kartya.email)) > 0);
  // a vendég által látott ár (a böngésző számolja ugyanazzal az árlistával); észszerű korlátok közé szorítva, Ernő javíthatja
  const n = (v) => Math.max(0, Math.min(5e6, Math.round(+v || 0)));
  const ar = d.ar || {}, B = await beall(db, ['visszatero_kedvezmeny']);
  const szallas = n(ar.szallas), extra = n(ar.extra), ked = n(ar.kedvezmeny) + (visszatero ? Math.round(szallas * szazalek(B.visszatero_kedvezmeny) / 100) : 0);
  const osszeg = Math.max(0, szallas + n(ar.gyerek) + n(ar.egy) + extra - ked);
  await db.prepare('INSERT OR REPLACE INTO ajanlat_ar (ajanlat_id, szallas, extra, kedvezmeny, visszatero, osszeg, ifa, reszletek) VALUES (?,?,?,?,?,?,?,?)')
    .bind(id, szallas, extra, ked, visszatero ? 1 : 0, osszeg, n(ar.ifa), JSON.stringify({ gyerek: n(ar.gyerek), egy: n(ar.egy), hosszu: n(ar.kedvezmeny) })).run();
  if (d.hirlevel === true) await vendegMent(db, { email: a.email, nev: a.nev, nyelv: a.nyelv, hirlevel: true, forras: 'foglalas' });
  // értesítés Ernőnek és visszaigazolás a vendégnek (ha a Brevo be van állítva); a válaszra nem vár
  const ap = await db.prepare('SELECT nev FROM apartman WHERE id = ?').bind(a.apartman_id).first();
  const sor = `${esc(ap ? ap.nev : a.apartman_id)} · ${a.erkezes} → ${a.tavozas} · ${a.felnott} felnőtt${a.gyerek ? ', ' + a.gyerek + ' gyerek' : ''}${osszeg ? ' · ' + osszeg.toLocaleString('hu-HU') + ' Ft' : ''}${visszatero ? ' · VISSZATÉRŐ VENDÉG' : ''}`;
  waitUntil(Promise.all([
    kuld(env, { to: env.ERTESITES_EMAIL, replyTo: a.email, subject: `Új foglalási kérés: ${ap ? ap.nev : ''} ${a.erkezes}`, html: keret('Új foglalási kérés', `<p>${sor}</p><p>${esc(a.nev)} · <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>${a.telefon ? ' · ' + esc(a.telefon) : ''}</p>${a.uzenet ? `<p style="white-space:pre-line">${esc(a.uzenet)}</p>` : ''}<p>Visszaigazolás a kezelőben: /admin/</p>`) }),
    kuld(env, { to: a.email, replyTo: env.ERTESITES_EMAIL, subject: a.nyelv === 'en' ? 'We have received your booking request – Akvarell' : 'Megkaptuk a foglalási kérésedet – Akvarell', html: keret(a.nyelv === 'en' ? 'Thank you for your request!' : 'Köszönjük a kérésedet!', `<p>${sor}</p><p>${a.nyelv === 'en' ? 'We will confirm by email shortly. Payment is due within 2 hours of confirmation.' : 'Hamarosan visszaigazoljuk e-mailben. A visszaigazolás után 2 órán belül kell fizetni.'}</p>`) }),
  ]).catch(() => { }));
  return J(200, { ok: true, visszatero: !!visszatero });
}
