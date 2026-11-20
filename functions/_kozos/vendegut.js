// Vendégút: a visszaigazolt foglaláshoz titkos vendégkönyv-link és automatikus levelek (Brevo, ha be van állítva).
// Levelek: visszaigazolás (azonnal) · érkezés előtt 3 nappal · távozás napján reggel · értékeléskérés másnap.
// Ernő érkezési napon reggel összefoglalót kap. Egy levél csak egyszer megy ki (vendegut.elkuldve), és csak sikeres küldés után jelölődik.
import { kuld, keret, esc } from './level.js';

const NAPMS = 864e5;
const isoBp = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' });          // ÉÉÉÉ-HH-NN zebegényi idő szerint
const oraBp = () => +new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Budapest', hour: '2-digit', hour12: false }).slice(0, 2);
const plusz = (nap, n) => { const d = new Date(nap + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export async function token(db, ajanlatId) {
  const van = await db.prepare('SELECT token FROM vendegut WHERE ajanlat_id = ?').bind(ajanlatId).first();
  if (van) return van.token;
  const b = crypto.getRandomValues(new Uint8Array(24)), t = btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await db.prepare('INSERT OR IGNORE INTO vendegut (ajanlat_id, token) VALUES (?, ?)').bind(ajanlatId, t).run();
  return (await db.prepare('SELECT token FROM vendegut WHERE ajanlat_id = ?').bind(ajanlatId).first()).token;
}

async function beall(db) {
  const r = (await db.prepare("SELECT kulcs, ertek FROM beallitas WHERE kulcs LIKE 'vk_%'").all()).results, o = {};
  r.forEach(x => { o[x.kulcs.slice(3)] = x.ertek; }); return o;
}

function szoveg(tipus, a, link, en, V, kartya) {
  const nap = (k) => new Date(k + 'T12:00:00Z').toLocaleDateString(en ? 'en-GB' : 'hu-HU', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'UTC' });
  const gomb = `<p style="margin:22px 0"><a href="${esc(link)}" style="background:#1d2a35;color:#fff;padding:13px 22px;border-radius:999px;text-decoration:none;font:600 16px system-ui,sans-serif">${en ? 'Open your guest book' : 'A vendégkönyved'}</a></p>`;
  const tel = V.tel ? `<p>${en ? 'Questions? Call us:' : 'Kérdés esetén hívj:'} <a href="tel:${esc(V.tel.replace(/\s/g, ''))}">${esc(V.tel)}</a></p>` : '';
  const sor = `<p><b>${esc(a.apnev)}</b> · ${nap(a.erkezes)} → ${nap(a.tavozas)}</p>`;
  if (tipus === 'visszaigazolas') return {
    subject: en ? 'Your stay is confirmed – Akvarell, Zebegény' : 'Visszaigazoltuk a foglalásodat – Akvarell, Zebegény',
    html: keret(en ? `See you soon, ${a.nev}!` : `Hamarosan találkozunk, ${a.nev}!`, sor + `<p>${en ? 'Everything for your stay is in your guest book: arrival, Wi-Fi, the hot tub, tips for each day. It works on your phone, no app needed.' : 'Minden, ami az ottléthez kell, a vendégkönyvedben van: érkezés, wifi, jakuzzi, napi ajánló. Telefonon működik, alkalmazás nélkül.'}</p>` + gomb + (kartya ? `<p>${en ? 'Your guest card is ready too: next time you book directly, the returning-guest discount is applied automatically.' : 'A vendégkártyád is elkészült: legközelebb közvetlenül foglalva a visszatérő kedvezmény magától jár.'} <a href="${esc(kartya)}">${en ? 'Open your card' : 'A kártyád'}</a></p>` : '') + tel) };
  if (tipus === 'elotte') return {
    subject: en ? 'Three days to go – arriving in Zebegény' : 'Még három nap – érkezés Zebegénybe',
    html: keret(en ? 'Three days to go' : 'Még három nap', sor + `<p>${en ? 'Check-in is from 15:00. If you would like to arrive earlier or need breakfast, tell us 48 hours ahead.' : 'Az apartman 15 órától foglalható el. Ha korábban érkeznél, vagy reggelit kérsz, 48 órával előtte jelezd.'}</p>` + gomb + tel) };
  if (tipus === 'tavozas') return {
    subject: en ? 'Departure today – thank you for staying' : 'Ma utazol – köszönjük, hogy itt voltál',
    html: keret(en ? 'Departure day' : 'Távozás napja', `<p>${en ? 'Please leave the apartment by 10:00. If you would like to stay longer, ask in your guest book – late departure depends on availability.' : 'Az apartmant 10 óráig kérjük elhagyni. Ha maradnál még, kérd a vendégkönyvben – a késői távozás a szabad helytől függ.'}</p>` + gomb) };
  if (tipus === 'ertekeles') return {
    subject: en ? 'How was your stay?' : 'Milyen volt nálunk?',
    html: keret(en ? 'How was your stay?' : 'Milyen volt nálunk?', `<p>${en ? 'Thank you for staying at Akvarell. A few honest words help other guests – and us – a lot.' : 'Köszönjük, hogy az Akvarellt választottad. Pár őszinte mondat sokat segít a következő vendégeknek és nekünk is.'}</p>` + (V.ertekeles_link ? `<p style="margin:22px 0"><a href="${esc(V.ertekeles_link)}" style="background:#2c6a89;color:#fff;padding:13px 22px;border-radius:999px;text-decoration:none;font:600 16px system-ui,sans-serif">${en ? 'Write a review' : 'Értékelés írása'}</a></p>` : '') + `<p>${en ? 'Or simply reply to this email.' : 'Vagy egyszerűen válaszolj erre a levélre.'}</p>`) };
}

async function jelol(db, id, tipus) {
  const r = await db.prepare('SELECT elkuldve FROM vendegut WHERE ajanlat_id = ?').bind(id).first(), o = JSON.parse(r ? r.elkuldve : '{}');
  o[tipus] = new Date().toISOString();
  await db.prepare('UPDATE vendegut SET elkuldve = ? WHERE ajanlat_id = ?').bind(JSON.stringify(o), id).run();
}

export async function kuldVendegnek(env, a, tipus, origin) {
  const db = env.DB, V = await beall(db), t = await token(db, a.id), link = `${origin}/#/vendeg/${t}`;
  const g = await db.prepare('SELECT token FROM vendeg WHERE email = ?').bind(String(a.email).toLowerCase()).first();
  const s = szoveg(tipus, a, link, a.nyelv === 'en', V, g ? `${origin}/#/kartya/${g.token}` : null);
  const r = await kuld(env, { to: a.email, replyTo: env.ERTESITES_EMAIL, subject: s.subject, html: s.html });
  if (r.ok) await jelol(db, a.id, tipus);
  return r;
}

// Óránként legfeljebb egyszer fut (a vendégoldal /api/adat kérése indítja a háttérben). Levél csak 8 és 20 óra között megy.
export async function utemezett(env, origin) {
  const db = env.DB, most = Date.now();
  if (!env.BREVO_API_KEY || !env.LEVEL_FELADO) return { kihagyva: 'nincs levelező' };
  // óránként egy futás, egy lépésben lefoglalva (két egyszerre érkező kérés közül csak az egyik megy tovább → nincs dupla levél)
  await db.prepare("INSERT OR IGNORE INTO gyorsitotar (kulcs, ertek, ido) VALUES ('vendegut_futas', '', 0)").run();
  const zar = await db.prepare("UPDATE gyorsitotar SET ido = ? WHERE kulcs = 'vendegut_futas' AND ido < ?").bind(most, most - 60 * 60e3).run();
  if (!zar.meta.changes) return { kihagyva: 'nemrég futott' };
  const ora = oraBp(); if (ora < 8 || ora >= 20) return { kihagyva: 'éjszaka' };
  const ma = isoBp();
  const L = (await db.prepare(`SELECT a.*, p.nev apnev, v.elkuldve FROM ajanlatkeres a JOIN apartman p ON p.id = a.apartman_id LEFT JOIN vendegut v ON v.ajanlat_id = a.id
    WHERE a.allapot = 'visszaigazolva' AND a.tavozas >= ? AND a.erkezes <= ?`).bind(plusz(ma, -3), plusz(ma, 3)).all()).results;
  const ki = [];
  for (const a of L) {
    const e = JSON.parse(a.elkuldve || '{}');
    let tipus = null;
    if (a.tavozas < ma && a.tavozas >= plusz(ma, -3) && !e.ertekeles) tipus = 'ertekeles';   // távozás után 1–3 nappal (ha egy nap kimaradna a futás, akkor is kimegy)
    else if (a.tavozas === ma && !e.tavozas) tipus = 'tavozas';
    else if (a.erkezes > ma && a.erkezes <= plusz(ma, 3) && !e.elotte) tipus = 'elotte';
    if (tipus) { const r = await kuldVendegnek(env, a, tipus, origin); ki.push([a.id, tipus, r.ok]); }
  }
  // Ernőnek: ma érkezők és távozók, naponta egyszer
  const ossz = await db.prepare("SELECT ertek FROM gyorsitotar WHERE kulcs = 'napi_osszefoglalo'").first();
  if (env.ERTESITES_EMAIL && (!ossz || ossz.ertek !== ma)) {
    const erk = L.filter(a => a.erkezes === ma), tav = L.filter(a => a.tavozas === ma);
    if (erk.length || tav.length) {
      const s = (x) => `<li>${esc(x.apnev)} · ${esc(x.nev)} · ${x.felnott} fő${x.gyerek ? ' + ' + x.gyerek + ' gyerek' : ''}${x.telefon ? ' · ' + esc(x.telefon) : ''}${x.uzenet ? `<br><small>${esc(x.uzenet)}</small>` : ''}</li>`;
      await kuld(env, { to: env.ERTESITES_EMAIL, subject: `Ma: ${erk.length} érkezés, ${tav.length} távozás`, html: keret('Mai nap', (erk.length ? `<h3>Érkezik</h3><ul>${erk.map(s).join('')}</ul>` : '') + (tav.length ? `<h3>Távozik (10 óráig)</h3><ul>${tav.map(s).join('')}</ul>` : '')) });
    }
    await db.prepare("INSERT OR REPLACE INTO gyorsitotar (kulcs, ertek, ido) VALUES ('napi_osszefoglalo', ?, ?)").bind(ma, most).run();
  }
  return { ki };
}
export { beall, isoBp, plusz };
