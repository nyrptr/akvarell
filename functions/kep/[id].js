// GET /kep/<id> – jóváhagyott kihívás-kép. A kezelő a még nem jóváhagyottat is látja (/admin/api/kep/<id>).
export async function onRequestGet({ params, env }) {
  const id = String(params.id || '');
  const r = await env.DB.prepare('SELECT tipus, kep FROM kihivas WHERE id = ? AND jovahagyva = 1').bind(id).first();
  if (!r) return new Response('Nincs ilyen kép.', { status: 404 });
  return new Response(new Uint8Array(r.kep), { headers: { 'content-type': r.tipus, 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'" } });
}
