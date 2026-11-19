// Közös rész: JSON-válasz, kezelő-ellenőrzés (Cloudflare Access).
export const J = (s, d, extra = {}) => new Response(JSON.stringify(d), {
  status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex', ...extra },
});

// Kezelő: az /admin útvonalat a Cloudflare Access védi (e-mailes kód).
// Nem elég a fejlécben jövő e-mail: az Access aláírt tokenjét (Cf-Access-Jwt-Assertion) a csapat nyilvános kulcsaival ellenőrizzük,
// Kötelező változó: ACCESS_AUD (az Access-alkalmazás AUD-címkéje). Választható: ACCESS_TEAM (különben a token kiadójából,
// csak *.cloudflareaccess.com), ADMIN_EMAILS (különben az Access-szabály dönti el, ki léphet be).
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
const kulcsok = {}, kulcsIdo = {};
export async function kezelo(request, env) {
  const tok = request.headers.get('cf-access-jwt-assertion') || (request.headers.get('cookie') || '').match(/CF_Authorization=([^;]+)/)?.[1];
  if (!tok || !env.ACCESS_AUD) return '';
  try {
    const [h, p, s] = tok.split('.');
    const fej = JSON.parse(new TextDecoder().decode(b64u(h))), adat = JSON.parse(new TextDecoder().decode(b64u(p)));
    const kiado = env.ACCESS_TEAM ? `https://${env.ACCESS_TEAM}.cloudflareaccess.com` : String(adat.iss || '');
    if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(kiado) || (adat.iss && adat.iss !== kiado)) return '';
    if (!kulcsok[kiado] || Date.now() - kulcsIdo[kiado] > 3600e3) {
      const r = await fetch(kiado + '/cdn-cgi/access/certs');
      kulcsok[kiado] = (await r.json()).keys; kulcsIdo[kiado] = Date.now();
    }
    const jwk = kulcsok[kiado].find(k => k.kid === fej.kid); if (!jwk) return '';
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(s), new TextEncoder().encode(h + '.' + p));
    const aud = Array.isArray(adat.aud) ? adat.aud : [adat.aud];
    if (!ok || !aud.includes(env.ACCESS_AUD) || adat.exp * 1000 < Date.now()) return '';
    const email = String(adat.email || '').toLowerCase();
    const lista = String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
    return email && (!lista.length || lista.includes(email)) ? email : '';
  } catch (e) { return ''; }
}

export const NAP = /^\d{4}-\d{2}-\d{2}$/;
export const ma = () => new Date().toISOString().slice(0, 10);
