// Közös rész: JSON-válasz, kezelő-ellenőrzés (Cloudflare Access).
export const J = (s, d, extra = {}) => new Response(JSON.stringify(d), {
  status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex', ...extra },
});

// Kezelő: az /admin útvonalat a Cloudflare Access védi (e-mailes kód).
// Nem elég a fejlécben jövő e-mail: az Access aláírt tokenjét (Cf-Access-Jwt-Assertion) a csapat nyilvános kulcsaival ellenőrizzük,
// és az e-mailnek az ADMIN_EMAILS listában kell lennie. Beállítás: ACCESS_TEAM (pl. "nyrptr"), ACCESS_AUD, ADMIN_EMAILS.
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
let kulcsok = null, kulcsIdo = 0;
export async function kezelo(request, env) {
  const tok = request.headers.get('cf-access-jwt-assertion') || (request.headers.get('cookie') || '').match(/CF_Authorization=([^;]+)/)?.[1];
  if (!tok || !env.ACCESS_TEAM || !env.ACCESS_AUD) return '';
  try {
    const [h, p, s] = tok.split('.');
    const fej = JSON.parse(new TextDecoder().decode(b64u(h))), adat = JSON.parse(new TextDecoder().decode(b64u(p)));
    if (Date.now() - kulcsIdo > 3600e3 || !kulcsok) {
      const r = await fetch(`https://${env.ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`);
      kulcsok = (await r.json()).keys; kulcsIdo = Date.now();
    }
    const jwk = kulcsok.find(k => k.kid === fej.kid); if (!jwk) return '';
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(s), new TextEncoder().encode(h + '.' + p));
    const aud = Array.isArray(adat.aud) ? adat.aud : [adat.aud];
    if (!ok || !aud.includes(env.ACCESS_AUD) || adat.exp * 1000 < Date.now()) return '';
    const email = String(adat.email || '').toLowerCase();
    const lista = String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
    return lista.includes(email) ? email : '';
  } catch (e) { return ''; }
}

export const NAP = /^\d{4}-\d{2}-\d{2}$/;
export const ma = () => new Date().toISOString().slice(0, 10);
