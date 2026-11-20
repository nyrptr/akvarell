// POST /api/uzenet – ajándékutalvány-kérés vagy kérdés. Ellenőrzés itt és az adatbázisban is.
import { J } from '../_kozos/k.js';
import { kuld, keret, esc } from '../_kozos/level.js';
import { korlatok, ipLeny } from '../_kozos/korlat.js';
export async function onRequestPost({ request, env, waitUntil }) {
  let d; try { d = await request.json(); } catch (e) { return J(400, { hiba: 'rossz kérés' }); }
  if (d.weboldal) return J(200, { ok: true });
  const s = (v, n) => String(v ?? '').trim().slice(0, n);
  const a = { tipus: d.tipus === 'utalvany' ? 'utalvany' : 'kerdes', nev: s(d.nev, 80), email: s(d.email, 120), telefon: s(d.telefon, 30) || null, szoveg: s(d.szoveg, 2000) || null, nyelv: d.nyelv === 'en' ? 'en' : 'hu' };
  if (a.nev.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) return J(400, { hiba: 'név vagy e-mail' });
  if (!(await korlatok(env.DB, [['uzenet:ip:' + await ipLeny(request), 6], ['uzenet:mind', 60]]))) return J(429, { hiba: 'sok' });
  await env.DB.prepare('INSERT INTO uzenet (tipus, nev, email, telefon, szoveg, nyelv) VALUES (?,?,?,?,?,?)').bind(a.tipus, a.nev, a.email, a.telefon, a.szoveg, a.nyelv).run();
  waitUntil(kuld(env, { to: env.ERTESITES_EMAIL, replyTo: a.email, subject: a.tipus === 'utalvany' ? 'Ajándékutalvány-kérés' : 'Új üzenet', html: keret(a.tipus === 'utalvany' ? 'Ajándékutalvány-kérés' : 'Új üzenet', `<p>${esc(a.nev)} · ${esc(a.email)}${a.telefon ? ' · ' + esc(a.telefon) : ''}</p><p style="white-space:pre-line">${esc(a.szoveg || '')}</p>`) }).catch(() => { }));
  return J(200, { ok: true });
}
