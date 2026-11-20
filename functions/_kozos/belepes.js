// A kezelő saját belépése, jelszó nélkül (Cloudflare Access nélkül is működik). Két külön fiók van:
//   gazda       – a ház tulajdonosa (az adatok az övéi; ő meg tudja szüntetni az üzemeltető hozzáférését),
//   uzemelteto  – aki a rendszert üzemelteti neki.
// Első belépés: fiókonként egy beüzemelő link (/admin/#kod=…). A kód egyszer váltható be; a tárolóban csak a SHA-256
// lenyomata áll (~148 bit véletlen, a lenyomatból nem fejthető vissza).
// Új eszköz: egy már belépett eszközön kért link (/admin/#be=…), 15 percig él, egyszer használható.
// Ha egyik eszköz sincs meg: annak a fióknak új kód-lenyomata kerül ide (PR); az új kóddal újra be lehet lépni, a fiók régi munkamenetei megszűnnek.
// Felülírható a BEUZEMELO_HASH_GAZDA / BEUZEMELO_HASH_UZEMELTETO környezeti változóval (másik ház, próba).
export const BEUZEMELO_HASH = { gazda: '15064ba30ca10203cba9cd6adb04994c9bd865386f9862f9fd0fc5686725976f', uzemelteto: '31876df2c499c9e9b3b0b45ade6cba5045e1863f858de62e29a6f08b22fd477d' };
export const SZEREPEK = ['gazda', 'uzemelteto'];
export const SUTI = '__Host-akv_kezelo', NAPOK = 90, LINK_PERC = 15;
const hex = (b) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const enc = (s) => new TextEncoder().encode(s);
export const sha = async (s) => hex(await crypto.subtle.digest('SHA-256', enc(s)));
export const veletlen = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
// állandó idejű összehasonlítás (ne lehessen az időből kitalálni, hány jel egyezik)
export function egyezik(a, b) {
  a = String(a); b = String(b); let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
const jo = (h) => /^[0-9a-f]{64}$/.test(h || '');
export const kodHash = (env) => ({ gazda: jo(env.BEUZEMELO_HASH_GAZDA) ? env.BEUZEMELO_HASH_GAZDA : BEUZEMELO_HASH.gazda, uzemelteto: jo(env.BEUZEMELO_HASH_UZEMELTETO) ? env.BEUZEMELO_HASH_UZEMELTETO : BEUZEMELO_HASH.uzemelteto });
export const sutiErtek = (request) => ((request.headers.get('cookie') || '').match(/(?:^|;\s*)__Host-akv_kezelo=([0-9a-f]{64})/) || [])[1] || '';
// érvényes munkamenet → a fiók szerepe ('gazda' | 'uzemelteto'), különben ''
export async function munkamenet(request, env) {
  const t = sutiErtek(request); if (!t || !env.DB) return '';
  try {
    const r = await env.DB.prepare('SELECT m.lejar, m.szerep FROM kezelo_munkamenet m JOIN kezelo f ON f.szerep = m.szerep AND f.aktiv = 1 WHERE m.token_hash = ?').bind(await sha(t)).first();
    return r && r.lejar > Date.now() && SZEREPEK.includes(r.szerep) ? r.szerep : '';
  } catch (e) { return ''; }
}
export async function ujMunkamenet(db, request, szerep) {
  const t = veletlen(32), most = Date.now();
  await db.batch([
    db.prepare('DELETE FROM kezelo_munkamenet WHERE lejar < ?').bind(most),
    db.prepare('INSERT INTO kezelo_munkamenet (token_hash, szerep, letrejott, lejar, eszkoz) VALUES (?, ?, ?, ?, ?)').bind(await sha(t), szerep, most, most + NAPOK * 864e5, String(request.headers.get('user-agent') || '').slice(0, 120)),
  ]);
  return `${SUTI}=${t}; Path=/; Max-Age=${NAPOK * 86400}; HttpOnly; Secure; SameSite=Strict`;
}
export const sutiTorles = `${SUTI}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
