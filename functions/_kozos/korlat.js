// Egyszerű kéréskorlát a nyilvános végpontokhoz (D1, a gyorsitotar táblában; külön szolgáltatás nem kell).
// kulcs: mire számolunk (pl. 'ajanlat:ip:<lenyomat>'), max: ennyi fér egy ablakba, perc: az ablak hossza.
// IP-címet és e-mail-címet nem tárolunk, csak rövid, napi sóval képzett lenyomatot.
export async function lenyomat(szoveg) {
  const nap = new Date().toISOString().slice(0, 10);
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nap + '|' + String(szoveg).toLowerCase()));
  return [...new Uint8Array(h)].slice(0, 9).map(b => b.toString(16).padStart(2, '0')).join('');
}
export const ipLeny = (request) => lenyomat(request.headers.get('cf-connecting-ip') || 'helyi');
// true = belefér; false = túl sok. Számlálás egy lépésben (párhuzamos kéréseknél sem csúszik át).
export async function korlat(db, kulcs, max, perc = 60) {
  const most = Date.now(), ablak = Math.floor(most / (perc * 60e3)), k = `korlat:${kulcs}:${ablak}`;
  const r = await db.prepare("INSERT INTO gyorsitotar (kulcs, ertek, ido) VALUES (?, '1', ?) ON CONFLICT(kulcs) DO UPDATE SET ertek = CAST(CAST(ertek AS INTEGER) + 1 AS TEXT) RETURNING ertek").bind(k, most).first();
  if (Math.random() < 0.02) await db.prepare("DELETE FROM gyorsitotar WHERE kulcs LIKE 'korlat:%' AND ido < ?").bind(most - 2 * 864e5).run();   // régi számlálók takarítása
  return +(r ? r.ertek : 1) <= max;
}
// több korlát egyszerre: [[kulcs, max, perc], …] – az első túllépésnél megáll
export async function korlatok(db, lista) {
  for (const [k, max, perc] of lista) if (!(await korlat(db, k, max, perc))) return false;
  return true;
}
