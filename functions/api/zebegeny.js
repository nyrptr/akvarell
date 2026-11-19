// GET /api/zebegeny – élő helyi adat: Duna-vízállás és vízhőfok (OVF geoportál, Nagymaros; felvíz: Esztergom). 30 percig tárolva.
import { J } from '../_kozos/k.js';
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
    const v = { nagymaros: ki.Nagymaros, esztergom: ki.Esztergom || null, forras: 'OVF, vízügyi geoportál', lekerve: most };
    await db.prepare("INSERT OR REPLACE INTO gyorsitotar (kulcs, ertek, ido) VALUES ('duna', ?, ?)").bind(JSON.stringify(v), most).run();
    return J(200, v, { 'cache-control': 'public, max-age=300' });
  } catch (e) {
    if (t) return J(200, { ...JSON.parse(t.ertek), regi: true });
    return J(503, { hiba: 'most nem elérhető' });
  }
}
