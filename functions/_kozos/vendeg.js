// Vendégkártya és visszatérő vendég: egy vendég = egy e-mail-cím (kisbetűsen). A hírlevél-hozzájárulás külön, időbélyeggel,
// visszavonható. Beállítások (beallitas tábla, a kezelő Vendégek fülén): visszatero_kedvezmeny %, kozvetlen_kedvezmeny %,
// portal_jutalek %, takaritas_dij Ft/foglalás, elonyok_hu / elonyok_en (soronként egy előny).
export const ALAP = { visszatero_kedvezmeny: '10', kozvetlen_kedvezmeny: '0', portal_jutalek: '15', takaritas_dij: '0', elonyok_hu: '', elonyok_en: '' };
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
  const r = await db.prepare("SELECT COUNT(*) n FROM ajanlatkeres WHERE lower(email) = ? AND allapot = 'visszaigazolva'").bind(em).first();
  if (r && r.n) return r.n;
  const v = await db.prepare("SELECT forras FROM vendeg WHERE email = ?").bind(em).first();
  return v && v.forras === 'haz' ? 1 : 0;
}
// a szobában kitett QR-kód titkos házkódja (első kéréskor jön létre; a kezelőben újragenerálható, ha kikerülne)
export async function hazKod(db) {
  const r = await db.prepare("SELECT ertek FROM beallitas WHERE kulcs = 'haz_kod'").first();
  if (r && r.ertek) return r.ertek;
  const k = ujToken().slice(0, 10);
  await db.prepare("INSERT OR REPLACE INTO beallitas (kulcs, ertek, frissitve) VALUES ('haz_kod', ?, datetime('now'))").bind(k).run();
  return k;
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
