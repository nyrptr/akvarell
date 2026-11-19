// GET /ical/<apartman>.ics – a saját foglalások naptára (ezt a címet kell beírni a Booking / Szállás.hu / Airbnb naptár-importjába).
import { kivitel } from '../_kozos/naptar.js';
export async function onRequestGet({ params, env }) {
  const id = String(params.nev || '').replace(/\.ics$/, '');
  const a = await env.DB.prepare('SELECT id, nev FROM apartman WHERE id = ?').bind(id).first();
  if (!a) return new Response('Nincs ilyen apartman.', { status: 404 });
  const n = (await env.DB.prepare("SELECT nap FROM foglalt_nap WHERE apartman_id = ? AND forras <> 'ical' AND nap >= date('now', '-30 day') ORDER BY nap").bind(id).all()).results.map(x => x.nap);
  return new Response(kivitel(a.id, a.nev, n), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'no-store' } });
}
