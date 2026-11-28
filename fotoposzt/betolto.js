// Háromrétegű betöltő: motor (app.js) + szakmacsomag + ügyfélcsomag.
// ?csomag=<név> → csomagok/ugyfel/<név>.json, és ha van szakma_id, csomagok/szakma/<id>.json alá fésülve
// (szakma az alap, az ügyfél felülírja: tömb id szerint, szótár kulcsonként). Szabály = tools/fotoposzt_csomag.py fesul().
// Régi egyrétegű csomag (csomagok/<név>.json) is betölthető. Hiba esetén a lapba ágyazott (Akvarell) készlet fut.
(() => {
  const nev = new URLSearchParams(location.search).get('csomag');
  const indit = () => { const s = document.createElement('script'); s.src = 'app.js';
    s.onload = () => { const t = document.createElement('script'); t.src = 'tervezo.js';
      t.onload = () => { const z = document.createElement('script'); z.src = 'zseb.js'; z.onload = () => { const v = document.createElement('script'); v.src = 'vago.js'; document.body.append(v); }; document.body.append(z); }; document.body.append(t); };
    document.body.append(s); };
  const hiba = (szoveg) => {
    const p = document.createElement('p');
    p.className = 'note'; p.setAttribute('role', 'alert');
    p.textContent = szoveg;
    document.querySelector('.wrap').prepend(p);
  };
  const json = (u) => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)));
  const fesul = (sz, u) => {
    const k = {};
    for (const kulcs of [...Object.keys(sz), ...Object.keys(u).filter(x => !(x in sz))]) {
      if (kulcs === 'szakma_meta') continue;
      const a = sz[kulcs], b = u[kulcs];
      if (Array.isArray(a) && Array.isArray(b)) {
        const ids = new Set(b.filter(x => x && typeof x === 'object').map(x => x.id));
        k[kulcs] = [...a.filter(x => !(x && typeof x === 'object' && ids.has(x.id))), ...b];
      } else if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) k[kulcs] = { ...a, ...b };
      else k[kulcs] = b !== undefined ? b : a;
    }
    k.szakma = sz.szakma_meta || {}; delete k.szakma_id;
    return k;
  };
  if (!nev) return indit();
  if (!/^[a-z0-9-]{1,40}$/.test(nev)) { hiba('Érvénytelen csomagnév, az alapcsomag töltődött be.'); return indit(); }
  json('csomagok/ugyfel/' + nev + '.json')
    .then(u => u.szakma_id ? json('csomagok/szakma/' + u.szakma_id + '.json').then(sz => fesul(sz, u)) : u)
    .catch(() => json('csomagok/' + nev + '.json'))
    .then(k => {
      if (!k.ceg || !k.ceg.hely || !Array.isArray(k.temak)) throw new Error('hiányos csomag');
      document.getElementById('keszlet').textContent = JSON.stringify(k);
    })
    .catch(e => hiba('A(z) „' + nev + '” csomag nem tölthető be (' + e.message + '), az alapcsomag töltődött be.'))
    .finally(indit);
})();
