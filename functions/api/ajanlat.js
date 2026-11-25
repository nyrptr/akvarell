// POST /api/ajanlat – vendég ajánlatkérése. Ellenőrzés itt és az adatbázisban is.
import { J, NAP, ma } from '../_kozos/k.js';
import { kuld, keret, esc } from '../_kozos/level.js';
import { vendegMent, ottletek, beall, szazalek } from '../_kozos/vendeg.js';
import { korlatok, ipLeny, lenyomat } from '../_kozos/korlat.js';
import { arSzamol, valosNap, ejszakak } from '../_kozos/ar.js';
import { SZ } from '../_kozos/szerver.js';
export async function onRequestPost({ request, env, waitUntil }) {
  let d; try { d = await request.json(); } catch (e) { return J(400, { hiba: 'rossz kérés' }); }
  if (d.weboldal) return J(200, { ok: true });                      // csapda a robotoknak
  const s = (v, n) => String(v ?? '').trim().slice(0, n);
  const a = { apartman_id: s(d.apartman_id, 20), erkezes: s(d.erkezes, 10), tavozas: s(d.tavozas, 10), felnott: +d.felnott, gyerek: +(d.gyerek ?? 0),
    nev: s(d.nev, 80), email: s(d.email, 120), telefon: s(d.telefon, 30) || null, uzenet: s(d.uzenet, 1000) || null, nyelv: d.nyelv === 'en' ? 'en' : 'hu' };
  if (!valosNap(a.erkezes) || !valosNap(a.tavozas) || a.tavozas <= a.erkezes || a.erkezes < ma()) return J(400, { hiba: 'dátum' });
  if (ejszakak(a.erkezes, a.tavozas) > 30 || a.erkezes > String(+ma().slice(0, 4) + 2) + ma().slice(4)) return J(400, { hiba: 'dátum' });   // legfeljebb 30 éjszaka, 2 éven belül
  if (![1, 2, 3].includes(a.felnott) || ![0, 1, 2].includes(a.gyerek)) return J(400, { hiba: 'létszám' });
  if (a.nev.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) return J(400, { hiba: 'név vagy e-mail' });
  const db = env.DB;
  const apartman = await db.prepare('SELECT * FROM apartman WHERE id = ?').bind(a.apartman_id).first();
  if (!apartman) return J(400, { hiba: 'apartman' });
  // kéréskorlát: egy címről 8/óra, egy e-mail-címre 3/óra (a visszaigazoló levél ne legyen levélszemétre használható), összesen 60/óra
  if (!(await korlatok(db, [['ajanlat:ip:' + await ipLeny(request), 8], ['ajanlat:em:' + await lenyomat(a.email), 3], ['ajanlat:mind', 60]]))) return J(429, { hiba: 'sok' });
  const fog = await db.prepare('SELECT COUNT(*) n FROM foglalt_nap WHERE apartman_id = ? AND nap >= ? AND nap < ?').bind(a.apartman_id, a.erkezes, a.tavozas).first();
  if (fog.n > 0) return J(409, { hiba: 'foglalt' });
  const be = await db.prepare('INSERT INTO ajanlatkeres (apartman_id, erkezes, tavozas, felnott, gyerek, nev, email, telefon, uzenet, nyelv) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(a.apartman_id, a.erkezes, a.tavozas, a.felnott, a.gyerek, a.nev, a.email, a.telefon, a.uzenet, a.nyelv).run();
  const id = be.meta.last_row_id;
  // visszatérő vendég: érvényes vendégkártya, vagy korábbi visszaigazolt foglalás ugyanezzel az e-mail-címmel
  const kartya = /^[A-Za-z0-9_-]{16,64}$/.test(d.kartya || '') ? await db.prepare('SELECT email FROM vendeg WHERE token = ?').bind(d.kartya).first() : null;
  const kartyas = !!(kartya && (await ottletek(db, kartya.email)) > 0);
  const visszatero = kartyas || (await ottletek(db, a.email)) > 0;
  // az árat a szerver számolja az adatbázis árlistájából (functions/_kozos/ar.js); a böngésző által küldött összeg csak az extrákhoz kell
  // (az extrák listája a vendégoldalon van), az is korlátok között. Ha a böngésző mást mutatott, az eltérés a részletekben látszik.
  const n = (v, max = 5e6) => Math.max(0, Math.min(max, Math.round(+v || 0)));
  const ar = d.ar || {}, B = await beall(db, ['visszatero_kedvezmeny']), sz = arSzamol(apartman, a.erkezes, a.tavozas, a.felnott, a.gyerek);
  const szallas = sz.szallas, extra = n(ar.extra, 1e6), vissza = visszatero ? Math.round(szallas * szazalek(B.visszatero_kedvezmeny) / 100) : 0, ked = sz.kedvezmeny + vissza;
  const osszeg = Math.max(0, szallas + sz.gyerek + sz.egy + extra - ked);
  const latott = n(ar.szallas) + n(ar.gyerek) + n(ar.egy) - n(ar.kedvezmeny), szamolt = szallas + sz.gyerek + sz.egy - sz.kedvezmeny;
  await db.prepare('INSERT OR REPLACE INTO ajanlat_ar (ajanlat_id, szallas, extra, kedvezmeny, visszatero, osszeg, ifa, reszletek) VALUES (?,?,?,?,?,?,?,?)')
    .bind(id, szallas, extra, ked, visszatero ? 1 : 0, osszeg, sz.ifa, JSON.stringify({ gyerek: sz.gyerek, egy: sz.egy, hosszu: sz.kedvezmeny, ...(d.ar && latott !== szamolt ? { bongeszo_mast_mutatott: latott } : {}) })).run();
  if (d.hirlevel === true) await vendegMent(db, { email: a.email, nev: a.nev, nyelv: a.nyelv, hirlevel: true, forras: 'foglalas' });
  // értesítés az üzemeltetőnek és visszaigazolás a vendégnek (ha a Brevo be van állítva); a válaszra nem vár
  const ap = apartman;
  const sor = `${esc(ap ? ap.nev : a.apartman_id)} · ${a.erkezes} → ${a.tavozas} · ${a.felnott} felnőtt${a.gyerek ? ', ' + a.gyerek + ' gyerek' : ''}${osszeg ? ' · ' + osszeg.toLocaleString('hu-HU') + ' Ft' : ''}${visszatero ? ' · VISSZATÉRŐ VENDÉG' : ''}`;
  waitUntil(Promise.all([
    kuld(env, { to: env.ERTESITES_EMAIL, replyTo: a.email, subject: `Új foglalási kérés: ${ap ? ap.nev : ''} ${a.erkezes}`, html: keret('Új foglalási kérés', `<p>${sor}</p><p>${esc(a.nev)} · <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>${a.telefon ? ' · ' + esc(a.telefon) : ''}</p>${a.uzenet ? `<p style="white-space:pre-line">${esc(a.uzenet)}</p>` : ''}<p>Visszaigazolás a kezelőben: /admin/</p>`) }),
    kuld(env, { to: a.email, replyTo: env.ERTESITES_EMAIL, subject: SZ.level.ajanlat_targy[a.nyelv === 'en' ? 'en' : 'hu'], html: keret(a.nyelv === 'en' ? 'Thank you for your request!' : 'Köszönjük a kérésedet!', `<p>${sor}</p><p>${a.nyelv === 'en' ? 'We will confirm by email shortly. Payment is due within 2 hours of confirmation.' : 'Hamarosan visszaigazoljuk e-mailben. A visszaigazolás után 2 órán belül kell fizetni.'}</p>`) }),
  ]).catch(() => { }));
  // a válasz csak a kártyával igazolt visszatérőt jelzi: e-mail-cím alapján nem áruljuk el, hogy valaki járt-e már itt (a kedvezmény így is jár, a levélben látszik)
  return J(200, { ok: true, visszatero: kartyas });
}
