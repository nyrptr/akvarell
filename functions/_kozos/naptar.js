// iCal be- és kivitel. Kivitel: a saját foglalások (kézi, ajánlatból) – ezt olvassa be a Booking / Szállás.hu / Airbnb.
// Behozatal: a külső naptárak foglalt napjai `forras = 'ical'` jelzéssel; minden szinkron cseréli őket.
const nap = (d) => d.toISOString().slice(0, 10);

export function ertelmez(szoveg) {
  const ki = new Set(), t = String(szoveg).replace(/\r?\n[ \t]/g, '');            // összehajtott sorok kibontása
  for (const ev of t.split('BEGIN:VEVENT').slice(1)) {
    const s = /DTSTART[^:\n]*:(\d{8})/.exec(ev), v = /DTEND[^:\n]*:(\d{8})/.exec(ev);
    if (!s) continue;
    const d = new Date(`${s[1].slice(0, 4)}-${s[1].slice(4, 6)}-${s[1].slice(6, 8)}T12:00:00Z`);
    const vege = v ? new Date(`${v[1].slice(0, 4)}-${v[1].slice(4, 6)}-${v[1].slice(6, 8)}T12:00:00Z`) : new Date(d.getTime() + 864e5);
    for (let i = 0; d < vege && i < 400; i++) { ki.add(nap(d)); d.setUTCDate(d.getUTCDate() + 1); }
  }
  return [...ki].sort();
}

export function kivitel(id, nev, napok) {
  const sor = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Akvarell Zebegeny//HU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:Akvarell – ${nev}`];
  const most = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  for (const n of napok) {
    const k = n.replace(/-/g, ''), d = new Date(n + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1);
    sor.push('BEGIN:VEVENT', `UID:${id}-${k}@akvarell`, `DTSTAMP:${most}`, `DTSTART;VALUE=DATE:${k}`, `DTEND;VALUE=DATE:${nap(d).replace(/-/g, '')}`, 'SUMMARY:Foglalt', 'END:VEVENT');
  }
  sor.push('END:VCALENDAR');
  return sor.join('\r\n') + '\r\n';
}

// Szinkron: legfeljebb félóránként (vagy kényszerítve a kezelőből). Hibánál a régi napok maradnak.
export async function szinkron(env, kenyszer = false) {
  const db = env.DB, most = Date.now();
  const ut = await db.prepare("SELECT ido FROM gyorsitotar WHERE kulcs = 'ical_szinkron'").first();
  if (!kenyszer && ut && most - ut.ido < 30 * 60e3) return { kihagyva: true };
  await db.prepare("INSERT OR REPLACE INTO gyorsitotar (kulcs, ertek, ido) VALUES ('ical_szinkron', '', ?)").bind(most).run();
  const cimek = (await db.prepare("SELECT kulcs, ertek FROM beallitas WHERE kulcs LIKE 'ical_%' AND ertek <> ''").all()).results;
  const eredmeny = {}, ma = nap(new Date());
  for (const c of cimek) {
    const ap = c.kulcs.slice(5);
    try {
      const r = await fetch(c.ertek, { headers: { 'user-agent': 'akvarell-naptar' }, cf: { cacheTtl: 0 } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const napok = ertelmez(await r.text()).filter(n => n >= ma);
      await db.batch([
        db.prepare("DELETE FROM foglalt_nap WHERE apartman_id = ? AND forras = 'ical'").bind(ap),
        ...napok.map(n => db.prepare("INSERT OR IGNORE INTO foglalt_nap (apartman_id, nap, forras) VALUES (?, ?, 'ical')").bind(ap, n)),
      ]);
      eredmeny[ap] = { ok: true, napok: napok.length };
    } catch (e) { eredmeny[ap] = { ok: false, hiba: String(e.message || e) }; }
  }
  await db.prepare("INSERT OR REPLACE INTO gyorsitotar (kulcs, ertek, ido) VALUES ('ical_eredmeny', ?, ?)").bind(JSON.stringify(eredmeny), most).run();
  return eredmeny;
}
