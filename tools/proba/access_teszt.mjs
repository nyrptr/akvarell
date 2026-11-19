import { kezelo } from '../../functions/_kozos/k.js';
const { subtle } = globalThis.crypto;
const kp = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' }, true, ['sign','verify']);
const jwk = { ...(await subtle.exportKey('jwk', kp.publicKey)), kid: 'k1' };
globalThis.fetch = async (u) => ({ json: async () => (u.startsWith('https://proba.cloudflareaccess.com/') ? { keys: [jwk] } : { keys: [] }) });
const b64 = (b) => Buffer.from(b).toString('base64url');
async function tok(adat, kulcs = kp.privateKey) {
  const h = b64(JSON.stringify({ alg: 'RS256', kid: 'k1' })), p = b64(JSON.stringify(adat));
  return h + '.' + p + '.' + b64(await subtle.sign('RSASSA-PKCS1-v1_5', kulcs, new TextEncoder().encode(h + '.' + p)));
}
const req = (t) => ({ headers: { get: (n) => n === 'cf-access-jwt-assertion' ? t : '' } });
const jo = { aud: ['AUD1'], email: 'a@b.hu', exp: Date.now() / 1000 + 600, iss: 'https://proba.cloudflareaccess.com' };
const masik = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' }, true, ['sign','verify']);
const esetek = [
  ['jó token', await tok(jo), { ACCESS_AUD: 'AUD1' }, 'a@b.hu'],
  ['rossz AUD', await tok({ ...jo, aud: ['X'] }), { ACCESS_AUD: 'AUD1' }, ''],
  ['lejárt', await tok({ ...jo, exp: 1 }), { ACCESS_AUD: 'AUD1' }, ''],
  ['idegen kiadó', await tok({ ...jo, iss: 'https://gonosz.example.com' }), { ACCESS_AUD: 'AUD1' }, ''],
  ['más kulccsal aláírt', await tok(jo, masik.privateKey), { ACCESS_AUD: 'AUD1' }, ''],
  ['nincs AUD-változó', await tok(jo), {}, ''],
  ['e-mail-lista, nincs rajta', await tok(jo), { ACCESS_AUD: 'AUD1', ADMIN_EMAILS: 'x@y.hu' }, ''],
  ['e-mail-lista, rajta van', await tok(jo), { ACCESS_AUD: 'AUD1', ADMIN_EMAILS: 'x@y.hu, A@b.hu' }, 'a@b.hu'],
  ['ACCESS_TEAM eltér a kiadótól', await tok(jo), { ACCESS_AUD: 'AUD1', ACCESS_TEAM: 'mas' }, ''],
];
let hiba = 0;
for (const [n, t, env, var_] of esetek) { const r = await kezelo(req(t), env); const ok = r === var_; hiba += !ok; console.log(ok ? 'OK  ' : 'HIBA', n, JSON.stringify(r)); }
process.exit(hiba ? 1 : 0);
