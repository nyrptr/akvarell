// GET /api/zebegeny – élő helyi adat: Duna-vízállás és vízhőfok (OVF geoportál, Nagymaros; felvíz: Esztergom),
// időjárás (met.no / Yr, CC BY 4.0, kereskedelmi célra is szabad, forrásmegjelöléssel). 30 percig tárolva.
import { J } from '../_kozos/k.js';
const MET = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=47.8&lon=18.91';
const GEO = 'https://geoportal.vizugy.hu/arcgis/rest/services/VIR/Arviz_vizmercek/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json';
export async function onRequestGet({ env }) {
  const db = env.DB, most = Date.now();
  const t = await db.prepare("SELECT ertek, ido FROM gyorsitotar WHERE kulcs = 'duna'").first();
  if (t && most - t.ido < 30 * 60e3) return J(200, JSON.parse(t.ertek), { 'cache-control': 'public, max-age=300' });
  try {
    const r = await fetch(GEO, { headers: { 'user-agent': 'akvarell-zebegeny' } });
    const d = await r.json(), ki = {};
    for (const f of d.features || []) {
      const a = {}; for (const [k, v] of Object.entries(f.attributes || {})) if (k.startsWith('vop.dbo.tAllomasFe.')) a[k.split('.').pop()] = v;
      if (a.VizfolyasNev === 'Duna' && (a.AllomasNev === 'Nagymaros' || a.AllomasNev === 'Esztergom'))
        ki[a.AllomasNev] = { cm: a.Vizallas, ido: a.Idopont, vizho: a.Vizho, fokozat: a.Fokozat || 0, kf1: a.KF1 };
    }
    if (!ki.Nagymaros) throw new Error('nincs adat');
    let ido = null;
    try {
      const m = await (await fetch(MET, { headers: { 'user-agent': 'akvarell-zebegeny github.com/nyrptr/akvarell' } })).json();
      const t = m.properties.timeseries[0].data;
      ido = { t: t.instant.details.air_temperature, jel: (t.next_1_hours || t.next_6_hours || {}).summary?.symbol_code || '' };
      // holnap délben (helyi dél ≈ 11:00 UTC télen, 10:00 nyáron – a 11:00 vagy 12:00 UTC sor, amelyik van)
      const h = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
      const hs = m.properties.timeseries.find(x => x.time === `${h}T11:00:00Z`) || m.properties.timeseries.find(x => x.time === `${h}T12:00:00Z`);
      if (hs) ido.holnap = { t: hs.data.instant.details.air_temperature, jel: (hs.data.next_6_hours || hs.data.next_1_hours || {}).summary?.symbol_code || '', csap: hs.data.next_6_hours?.details?.precipitation_amount ?? null };
    } catch (e) { }
    const v = { nagymaros: ki.Nagymaros, esztergom: ki.Esztergom || null, ido, forras: 'OVF vízügyi geoportál; met.no', lekerve: most };
    await db.prepare("INSERT OR REPLACE INTO gyorsitotar (kulcs, ertek, ido) VALUES ('duna', ?, ?)").bind(JSON.stringify(v), most).run();
    return J(200, v, { 'cache-control': 'public, max-age=300' });
  } catch (e) {
    if (t) return J(200, { ...JSON.parse(t.ertek), regi: true });
    return J(503, { hiba: 'most nem elérhető' });
  }
}
