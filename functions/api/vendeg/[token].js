// /api/vendeg/<token> – a vendég saját vendégkönyve (titkos link a visszaigazoló levélben).
// GET: foglalás + a ház tudnivalói. A wifi-jelszó és a bejutás csak érkezés előtt 2 naptól a távozás utáni napig látszik.
// POST: kérés Ernőnek (késői távozás, reggeli, egyéb) → uzenet tábla + e-mail.
import { J } from '../../_kozos/k.js';
import { beall, isoBp, plusz } from '../../_kozos/vendegut.js';
import { kuld, keret, esc } from '../../_kozos/level.js';
async function foglalas(db, t) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(t || '')) return null;
  return db.prepare(`SELECT a.id, a.apartman_id, a.erkezes, a.tavozas, a.felnott, a.gyerek, a.nev, a.email, a.telefon, a.nyelv, a.allapot, p.nev apnev
    FROM vendegut v JOIN ajanlatkeres a ON a.id = v.ajanlat_id JOIN apartman p ON p.id = a.apartman_id WHERE v.token = ?`).bind(t).first();
}
export async function onRequestGet({ env, params }) {
  const a = await foglalas(env.DB, params.token);
  if (!a || a.allapot !== 'visszaigazolva') return J(404, { hiba: 'nincs ilyen vendégkönyv' });
  const V = await beall(env.DB), ma = isoBp(), nyitva = ma >= plusz(a.erkezes, -2) && ma <= plusz(a.tavozas, 1);
  const vk = { tel: V.tel || '', parkolas_hu: V.parkolas_hu || '', parkolas_en: V.parkolas_en || '', jakuzzi_hu: V.jakuzzi_hu || '', jakuzzi_en: V.jakuzzi_en || '', ertekeles_link: V.ertekeles_link || '' };
  if (nyitva) Object.assign(vk, { wifi_nev: V.wifi_nev || '', wifi_jelszo: V.wifi_jelszo || '', bejutas_hu: V.bejutas_hu || '', bejutas_en: V.bejutas_en || '' });
  const g = await env.DB.prepare('SELECT token FROM vendeg WHERE email = ?').bind(String(a.email).toLowerCase()).first();
  const { email, telefon, allapot, id, ...f } = a;
  return J(200, { foglalas: f, vk, nyitva, ma, kartya: g ? g.token : null }, { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
}
export async function onRequestPost({ request, env, params, waitUntil }) {
  const a = await foglalas(env.DB, params.token);
  if (!a || a.allapot !== 'visszaigazolva') return J(404, { hiba: 'nincs' });
  let d; try { d = await request.json(); } catch (e) { return J(400, { hiba: 'rossz kérés' }); }
  const TIP = { kesoi: 'Késői távozás', korai: 'Korai érkezés', reggeli: 'Reggeli', masszazs: 'Masszázs', egyeb: 'Üzenet' };
  const tip = TIP[d.tipus] ? d.tipus : 'egyeb', szoveg = String(d.szoveg || '').trim().slice(0, 800);
  if (tip === 'egyeb' && szoveg.length < 2) return J(400, { hiba: 'üres' });
  const n = await env.DB.prepare("SELECT COUNT(*) n FROM uzenet WHERE email = ? AND letrehozva > datetime('now','-1 hour')").bind(a.email).first();
  if (n.n >= 6) return J(429, { hiba: 'sok' });
  const sz = `[${TIP[tip]}] ${a.apnev} · ${a.erkezes} → ${a.tavozas}${szoveg ? '\n' + szoveg : ''}`;
  await env.DB.prepare("INSERT INTO uzenet (tipus, nev, email, telefon, szoveg, nyelv) VALUES ('kerdes',?,?,?,?,?)").bind(a.nev, a.email, a.telefon, sz, a.nyelv).run();
  waitUntil(kuld(env, { to: env.ERTESITES_EMAIL, replyTo: a.email, subject: `Vendégkérés: ${TIP[tip]} – ${a.apnev}, ${a.nev}`, html: keret(TIP[tip], `<p style="white-space:pre-line">${esc(sz)}</p><p>${esc(a.nev)} · <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>${a.telefon ? ' · ' + esc(a.telefon) : ''}</p>`) }).catch(() => { }));
  return J(200, { ok: true });
}
