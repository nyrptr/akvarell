// GET /api/google – a Google-értékelések élőben (Places API, csak ha az üzemeltető megadta a kulcsot és a hely azonosítóját).
// A Google szabálya szerint a tartalom nem tárolható (csak a hely azonosítója), és a szerzőt, linket mutatni kell: ezért nincs gyorsítótár,
// és csak akkor kérjük le, ha a vendég megnyomja a gombot (így a havi ingyenes kereten belül marad).
import { J } from '../_kozos/k.js';
import { beall } from '../_kozos/vendeg.js';
import { korlatok } from '../_kozos/korlat.js';
export async function onRequestGet({ request, env }) {
  const b = await beall(env.DB, ['google_place_id']);
  if (!env.GOOGLE_PLACES_KEY || !b.google_place_id) return J(404, { hiba: 'nincs beállítva' });
  // minden lekérés fizetős Google-hívás lehet: óránként legfeljebb 40, naponta 300 (a havi ingyenes keret alatt marad)
  if (!(await korlatok(env.DB, [['google:ora', 40], ['google:nap', 300, 1440]]))) return J(429, { hiba: 'sok' });
  const ny = new URL(request.url).searchParams.get('ny') === 'en' ? 'en' : 'hu';
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(b.google_place_id)}?languageCode=${ny}`, {
    headers: { 'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' } });
  if (!r.ok) return J(502, { hiba: 'Google most nem érhető el' });
  const d = await r.json();
  return J(200, { pont: d.rating ?? null, db: d.userRatingCount ?? 0, link: d.googleMapsUri || null,
    velemenyek: (d.reviews || []).slice(0, 5).map(x => ({ szoveg: x.text?.text || '', pont: x.rating, mikor: x.relativePublishTimeDescription || '', szerzo: x.authorAttribution?.displayName || '', szerzo_link: x.authorAttribution?.uri || null, link: x.googleMapsUri || null })) },
    { 'cache-control': 'no-store' });
}
