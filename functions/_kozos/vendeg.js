// Vendégkártya és visszatérő vendég: egy vendég = egy e-mail-cím (kisbetűsen). A hírlevél-hozzájárulás külön, időbélyeggel,
// visszavonható. Beállítások (beallitas tábla, a kezelő Vendégek fülén): visszatero_kedvezmeny %, kozvetlen_kedvezmeny %,
// portal_jutalek %, takaritas_dij Ft/foglalás, elonyok_hu / elonyok_en (soronként egy előny).
import { SZ } from './szerver.js';
export const ALAP = { visszatero_kedvezmeny: '10', kozvetlen_kedvezmeny: '0', portal_jutalek: '15', takaritas_dij: '0', elonyok_hu: '', elonyok_en: '',
  // külső értékelések: a portálok nem engedik élőben a saját oldalon (a Booking Review API-ja csak belső használatra), ezért az üzemeltető írja át, dátummal, és a pont a portálra visz
  ert_booking_pont: '9,8', ert_booking_db: '', ert_booking_url: SZ.ertekeles.booking_url,
  ert_szallas_pont: '9,9', ert_szallas_db: '46', ert_szallas_url: SZ.ertekeles.szallas_url,
  ert_google_url: '', ert_frissitve: '2026-11-20', google_place_id: '' };
export const NYILVANOS = ['visszatero_kedvezmeny', 'kozvetlen_kedvezmeny', 'elonyok_hu', 'elonyok_en', 'ert_booking_pont', 'ert_booking_db', 'ert_booking_url', 'ert_szallas_pont', 'ert_szallas_db', 'ert_szallas_url', 'ert_google_url', 'ert_frissitve', 'google_place_id'];
export async function beall(db, kulcsok = Object.keys(ALAP)) {
  const r = (await db.prepare(`SELECT kulcs, ertek FROM beallitas WHERE kulcs IN (${kulcsok.map(() => '?').join(',')})`).bind(...kulcsok).all()).results;
  const o = {}; kulcsok.forEach(k => { o[k] = ALAP[k] ?? ''; }); r.forEach(x => { o[x.kulcs] = x.ertek; });
  return o;
}
export const szazalek = (v, max = 50) => Math.max(0, Math.min(max, Math.round(+v || 0)));
export function ujToken() {
  const b = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export const emailOk = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || '');
// hány visszaigazolt (és már elkezdett) ottléte volt ezzel az e-mail-címmel
// + a házban (a szoba QR-kódjáról, érvényes házkóddal) igényelt kártya egy ottlétnek számít, ha más nincs – így a portálos vendég is visszatérő lesz
export async function ottletek(db, email) {
  const em = email.toLowerCase();
  const r = await db.prepare("SELECT COUNT(*) n FROM ajanlatkeres WHERE lower(email) = ? AND allapot = 'visszaigazolva' AND id NOT IN (SELECT ajanlat_id FROM proba_ajanlat)").bind(em).first();
  if (r && r.n) return r.n;
  const v = await db.prepare("SELECT forras FROM vendeg WHERE email = ?").bind(em).first();
  return v && v.forras === 'haz' ? 1 : 0;
}
// A szobában kitett QR-kód titkos kódja: szobánként egy, ÁLLANDÓ (első kéréskor jön létre, utána magától soha nem változik;
// csak a kezelőben, szobánként újragenerálható, ha a kártya kikerülne a házból). Vendégenként nem cserélődik.
export async function szobaKod(db, ap) {
  const kulcs = 'szoba_kod_' + ap, r = await db.prepare('SELECT ertek FROM beallitas WHERE kulcs = ?').bind(kulcs).first();
  if (r && r.ertek) return r.ertek;
  const k = ujToken().slice(0, 10);
  await db.prepare("INSERT OR IGNORE INTO beallitas (kulcs, ertek, frissitve) VALUES (?, ?, datetime('now'))").bind(kulcs, k).run();
  return (await db.prepare('SELECT ertek FROM beallitas WHERE kulcs = ?').bind(kulcs).first()).ertek;
}
export async function szobaKodok(db) {
  const ki = {};
  for (const a of (await db.prepare('SELECT id FROM apartman ORDER BY sorrend').all()).results) ki[a.id] = await szobaKod(db, a.id);
  return ki;
}
export async function ujSzobaKod(db, ap) {
  await db.prepare("INSERT OR REPLACE INTO beallitas (kulcs, ertek, frissitve) VALUES (?, ?, datetime('now'))").bind('szoba_kod_' + ap, ujToken().slice(0, 10)).run();
  return szobaKod(db, ap);
}
// kód → szoba. Ismeretlen kód: null. A régi, házszintű kód (ha egy telepítésben már van) továbbra is érvényes, szoba nélkül: { apartman_id: null }.
export async function kodFeloldas(db, kod) {
  if (typeof kod !== 'string' || kod.length < 8) return null;
  const r = await db.prepare("SELECT kulcs FROM beallitas WHERE kulcs LIKE 'szoba_kod_%' AND ertek = ?").bind(kod).first();
  if (r) return { apartman_id: r.kulcs.slice(10) };
  const h = await db.prepare("SELECT 1 x FROM beallitas WHERE kulcs = 'haz_kod' AND ertek = ?").bind(kod).first();
  return h ? { apartman_id: null } : null;
}
// a vendég kártyájához rögzíti, melyik szoba QR-kódjáról kérte (a kezelő itt látja, hol alszik/aludt)
export async function szobaJegyez(db, email, ap) {
  if (!ap) return;
  await db.prepare("INSERT OR IGNORE INTO vendeg_szoba (vendeg_id, apartman_id) SELECT id, ? FROM vendeg WHERE email = ?").bind(ap, String(email).toLowerCase()).run();
}
// vendég mentése / frissítése; a hírlevél-hozzájárulást csak bekapcsolja (visszavonni a leiratkozás tudja)
export async function vendegMent(db, { email, nev, nyelv, hirlevel, forras }) {
  const em = String(email).trim().toLowerCase().slice(0, 120);
  const van = await db.prepare('SELECT * FROM vendeg WHERE email = ?').bind(em).first();
  if (van) {
    if (hirlevel && !van.hirlevel) await db.prepare("UPDATE vendeg SET hirlevel = 1, hirlevel_ido = datetime('now'), leiratkozva = NULL WHERE id = ?").bind(van.id).run();
    if (nev && nev.length >= 2 && nev !== van.nev) await db.prepare('UPDATE vendeg SET nev = ? WHERE id = ?').bind(nev.slice(0, 80), van.id).run();
    if (forras === 'haz' && van.forras !== 'haz') await db.prepare("UPDATE vendeg SET forras = 'haz' WHERE id = ?").bind(van.id).run();
    return { ...van, hirlevel: hirlevel ? 1 : van.hirlevel };
  }
  const t = ujToken();
  await db.prepare(`INSERT INTO vendeg (email, nev, nyelv, token, hirlevel, hirlevel_ido, forras) VALUES (?,?,?,?,?,${hirlevel ? "datetime('now')" : 'NULL'},?)`)
    .bind(em, String(nev || '').slice(0, 80) || em.split('@')[0], nyelv === 'en' ? 'en' : 'hu', t, hirlevel ? 1 : 0, forras || 'kartya').run();
  return db.prepare('SELECT * FROM vendeg WHERE email = ?').bind(em).first();
}
