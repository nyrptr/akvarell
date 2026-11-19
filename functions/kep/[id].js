// GET /kep/<id> – jóváhagyott kihívás-kép. A kezelő a még nem jóváhagyottat is látja (/admin/api/kep/<id>).
export async function onRequestGet({ params, env }) {
  const id = String(params.id || '');
  const r = await env.DB.prepare('SELECT tipus FROM kihivas WHERE id = ? AND jovahagyva = 1').bind(id).first();
  if (!r) return new Response('Nincs ilyen kép.', { status: 404 });
  const k = await env.KEPEK.get('kep:' + id, 'arrayBuffer');
  if (!k) return new Response('Nincs ilyen kép.', { status: 404 });
  return new Response(k, { headers: { 'content-type': r.tipus, 'cache-control': 'public, max-age=86400' } });
}
