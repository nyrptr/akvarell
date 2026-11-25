// E-mail a Brevón át (ugyanúgy, mint a veledaholnapert.hu-n). Csak ha be van állítva: BREVO_API_KEY (titok),
// LEVEL_FELADO (a Brevóban hitelesített feladó, pl. a ház info-címe), ERTESITES_EMAIL (az üzemeltető címe).
// Ha valami hiányzik, nem küld, és ezt nem tekinti hibának (a foglalás így is bekerül a kezelőbe).
import { SZ } from './szerver.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function kuld(env, { to, subject, html, replyTo }) {
  // Helyi próba (tools/proba/utak): LEVEL_PROBA=igen → a levél nem megy ki, a gyorsitotar táblába kerül, és a próba onnan olvassa vissza.
  // Élesben nem kapcsolható be véletlenül: ha van valódi levelező-kulcs, mindig az küld.
  if (env.LEVEL_PROBA === 'igen' && !env.BREVO_API_KEY && env.DB) {
    if (!to) return { ok: false, kihagyva: true };
    await env.DB.prepare('INSERT INTO gyorsitotar (kulcs, ertek, ido) VALUES (?, ?, ?)').bind('level:' + Date.now() + ':' + crypto.randomUUID(), JSON.stringify({ to, subject, html, replyTo: replyTo || null }), Date.now()).run();
    return { ok: true, proba: true };
  }
  if (!env.BREVO_API_KEY || !env.LEVEL_FELADO || !to) return { ok: false, kihagyva: true };
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST', headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: { name: SZ.level.felado, email: env.LEVEL_FELADO }, to: [{ email: to, contactPixelTrackingConsent: false }], replyTo: replyTo ? { email: replyTo } : undefined, subject, htmlContent: html, tags: [SZ.cimke] }),
  });
  return { ok: r.ok, status: r.status };
}
export const levelezBe = (env) => !!(env.BREVO_API_KEY && env.LEVEL_FELADO) || (env.LEVEL_PROBA === 'igen' && !env.BREVO_API_KEY);
export function keret(cim, tartalom) {
  return `<!doctype html><html><body style="margin:0;background:#f6f1e7;font:16px/1.6 Georgia,serif;color:#1d2a35"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px"><tr><td style="padding:22px 26px;border-bottom:1px solid #e3dac8;font-weight:700;color:#2c6a89">${SZ.level.fejlec}</td></tr><tr><td style="padding:22px 26px"><h1 style="font-size:22px;margin:0 0 12px">${esc(cim)}</h1>${tartalom}</td></tr></table></td></tr></table></body></html>`;
}
export { esc };
