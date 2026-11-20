// POST /api/kartya – vendégkártya igénylése: név, e-mail, külön hírlevél-hozzájárulás. Visszaadja a kártya tokenjét.
import { J, oldalCim } from '../../_kozos/k.js';
import { korlat, korlatok, ipLeny, lenyomat } from '../../_kozos/korlat.js';
import { kuld, keret, esc } from '../../_kozos/level.js';
import { vendegMent, emailOk, ottletek, beall, szazalek, hazKod } from '../../_kozos/vendeg.js';
export async function onRequestPost({ request, env }) {
  let d; try { d = await request.json(); } catch (e) { return J(400, { hiba: 'rossz kérés' }); }
  if (d.weboldal) return J(200, { ok: true });
  const nev = String(d.nev || '').trim().slice(0, 80), email = String(d.email || '').trim();
  if (nev.length < 2 || !emailOk(email)) return J(400, { hiba: 'név vagy e-mail' });
  if (!(await korlatok(env.DB, [['kartya:ip:' + await ipLeny(request), 8]]))) return J(429, { hiba: 'sok' });
  const n = await env.DB.prepare("SELECT COUNT(*) n FROM vendeg WHERE letrehozva > datetime('now','-1 hour')").first();
  if (n.n > 60) return J(429, { hiba: 'sok' });
  const haz = typeof d.haz === 'string' && d.haz.length >= 8 && d.haz === await hazKod(env.DB);
  // ha erre a címre már van kártya, nem adjuk ki itt (bárki beírhat egy idegen címet): a link e-mailben megy a tulajdonosnak
  const van = await env.DB.prepare('SELECT token, nyelv FROM vendeg WHERE email = ?').bind(email.toLowerCase()).first();
  if (van) {
    if (haz) await env.DB.prepare("UPDATE vendeg SET forras = 'haz' WHERE email = ?").bind(email.toLowerCase()).run();
    const en = van.nyelv === 'en', link = `${oldalCim(env, request)}/#/kartya/${van.token}`;
    // ugyanarra a címre 6 óránként legfeljebb 2 levél megy (más ne tudja levelekkel elárasztani a kártya tulajdonosát)
    const r = !(await korlat(env.DB, 'kartya:level:' + await lenyomat(email), 2, 360)) ? { ok: true } : await kuld(env, { to: email, subject: en ? 'Your Akvarell guest card' : 'Az Akvarell vendégkártyád', html: keret(en ? 'Your guest card' : 'A vendégkártyád', `<p><a href="${esc(link)}">${en ? 'Open your card' : 'A kártyád megnyitása'}</a></p>`) }).catch(() => ({ ok: false }));
    return J(200, { mar_van: true, elkuldve: !!r.ok });
  }        // a szoba QR-kódjáról jött: itt alszik / aludt
  const v = await vendegMent(env.DB, { email, nev, nyelv: d.nyelv, hirlevel: d.hirlevel === true, forras: haz ? 'haz' : 'kartya' });
  const b = await beall(env.DB, ['visszatero_kedvezmeny']);
  return J(200, { token: v.token, nev: v.nev, ottlet: await ottletek(env.DB, v.email), kedvezmeny: szazalek(b.visszatero_kedvezmeny), hirlevel: !!v.hirlevel });
}
