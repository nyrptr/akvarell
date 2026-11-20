// A kezelő saját belépése (Cloudflare Access nélkül is működik): egy jelszó, eszközönként egy munkamenet-süti.
// Beüzemelés: egyszer használható beüzemelő kóddal lehet jelszót beállítani. A tárolóban csak a kód SHA-256 lenyomata áll
// (a kód ~148 bit véletlen, a lenyomatból nem fejthető vissza); magát a kódot Péter adja át a ház gazdájának.
// Elfelejtett jelszó: új kód lenyomata kerül ide (PR), azzal újra beállítható – a régi munkamenetek ekkor megszűnnek.
// Felülírható a BEUZEMELO_HASH környezeti változóval (másik ház, saját telepítés).
export const BEUZEMELO_HASH = '31876df2c499c9e9b3b0b45ade6cba5045e1863f858de62e29a6f08b22fd477d';
export const SUTI = '__Host-akv_kezelo', NAPOK = 90, KOR = 100000, MIN_JELSZO = 10;
const hex = (b) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const enc = (s) => new TextEncoder().encode(s);
export const sha = async (s) => hex(await crypto.subtle.digest('SHA-256', enc(s)));
export const veletlen = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
export async function jelszoHash(jelszo, so, kor = KOR) {
  const k = await crypto.subtle.importKey('raw', enc(jelszo), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc(so), iterations: kor }, k, 256));
}
// állandó idejű összehasonlítás (ne lehessen az időből kitalálni, hány jel egyezik)
export function egyezik(a, b) {
  a = String(a); b = String(b); let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
export const kodHash = (env) => /^[0-9a-f]{64}$/.test(env.BEUZEMELO_HASH || '') ? env.BEUZEMELO_HASH : BEUZEMELO_HASH;
export const sutiErtek = (request) => ((request.headers.get('cookie') || '').match(/(?:^|;\s*)__Host-akv_kezelo=([0-9a-f]{64})/) || [])[1] || '';
// érvényes munkamenet → 'kezelo', különben ''
export async function munkamenet(request, env) {
  const t = sutiErtek(request); if (!t || !env.DB) return '';
  try {
    const r = await env.DB.prepare('SELECT lejar FROM kezelo_munkamenet WHERE token_hash = ?').bind(await sha(t)).first();
    return r && r.lejar > Date.now() ? 'kezelo' : '';
  } catch (e) { return ''; }
}
export async function ujMunkamenet(db, request) {
  const t = veletlen(32), most = Date.now();
  await db.batch([
    db.prepare('DELETE FROM kezelo_munkamenet WHERE lejar < ?').bind(most),
    db.prepare('INSERT INTO kezelo_munkamenet (token_hash, letrejott, lejar, eszkoz) VALUES (?, ?, ?, ?)').bind(await sha(t), most, most + NAPOK * 864e5, String(request.headers.get('user-agent') || '').slice(0, 120)),
  ]);
  return `${SUTI}=${t}; Path=/; Max-Age=${NAPOK * 86400}; HttpOnly; Secure; SameSite=Strict`;
}
export const sutiTorles = `${SUTI}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
