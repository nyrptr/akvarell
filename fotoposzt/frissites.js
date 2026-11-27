// Csomagfrissítés (ZSEBMARKETING, 11-27). Élesben: a szerverről érkező csomag-javítás (nálunk AI + ember készíti);
// itt BEMUTATÓ: bemutato/frissites.json. A letöltött javítás a helyi tárban él, és indításkor a készletbe fésülődik
// (tömb id szerint, a javítás nyer) – az app.js már a frissített készletet olvassa, AI nélkül.
(() => {
  const KULCS = 'akvposzt-frissites';
  const $ = (id) => document.getElementById(id);
  const olvas = () => { try { return JSON.parse(localStorage.getItem(KULCS) || 'null'); } catch (e) { return null; } };
  const fesul = (k, f) => {
    for (const [kulcs, v] of Object.entries(f)) {
      if (['verzio', 'cim', 'miert', 'valtozas'].includes(kulcs)) continue;
      if (Array.isArray(v) && Array.isArray(k[kulcs])) { const ids = new Set(v.map(x => x && x.id)); k[kulcs] = [...k[kulcs].filter(x => !ids.has(x && x.id)), ...v]; }
      else if (v && typeof v === 'object' && k[kulcs] && typeof k[kulcs] === 'object') k[kulcs] = { ...k[kulcs], ...v };
      else k[kulcs] = v;
    }
    return k;
  };
  const kesz = $('keszlet'), f = olvas();
  if (kesz && f) { try { kesz.textContent = JSON.stringify(fesul(JSON.parse(kesz.textContent), f)); } catch (e) {} }

  function sav() {
    const el = $('frissSav'); if (!el) return;
    const akt = olvas();
    fetch('bemutato/frissites.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(uj => {
      el.textContent = '';
      if (akt && (!uj || akt.verzio === uj.verzio)) {
        el.hidden = false; el.className = 'bemutato';
        const p = document.createElement('p'); p.textContent = `Frissítve (${akt.cim}): ` + (akt.valtozas || []).join('; ') + '.'; el.append(p);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = 'Visszaállítás (újra kipróbálni)';
        b.addEventListener('click', () => { localStorage.removeItem(KULCS); location.reload(); }); el.append(b);
        return;
      }
      if (!uj) { el.hidden = true; return; }
      el.hidden = false; el.className = 'bemutato';
      const p = document.createElement('p'); p.textContent = `Frissítés érkezett (bemutató): ${uj.cim}.`; el.append(p);
      const m = document.createElement('p'); m.textContent = uj.miert; el.append(m);
      const ul = document.createElement('ul'); for (const v of uj.valtozas || []) { const li = document.createElement('li'); li.textContent = v; ul.append(li); } el.append(ul);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn full'; b.id = 'frissLe'; b.textContent = 'Frissítés letöltése';
      b.addEventListener('click', () => { try { localStorage.setItem(KULCS, JSON.stringify(uj)); } catch (e) {} b.textContent = 'Letöltve – újraindul…'; setTimeout(() => location.reload(), 900); });
      el.append(b);
    }).catch(() => {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sav); else sav();
})();
