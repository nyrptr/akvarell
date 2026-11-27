// Tervező (ZSEBMARKETING, 11-27): cél → kinek → milyen gyakran → 4 hetes posztnaptár + teljesíthető fotókérések.
// AI nélkül: a szakmacsomag (K.szakma) és az ügyfélcsomag (K.temak, K.mintak) adataiból program számol.
// Helyzetkép: évszak és napszak a dátumból; képtartalék: témához nincs anyag → szomszéd téma, a fotókérés listára kerül.
(() => {
  const $ = (id) => document.getElementById(id);
  const K = JSON.parse($('keszlet').textContent);
  const SZ = K.szakma || {};
  // Kampányok (11-27): a terv kampány – neve, célja; több is lehet, egy az aktív. A régi egy-tervet átveszi.
  const KAMP = 'akvposzt-kampanyok', T_KULCS = 'akvposzt-terv';
  const kamp = {
    get() { let v = null; try { v = JSON.parse(localStorage.getItem(KAMP) || 'null'); } catch (e) {}
      if (!v) { v = { lista: [], aktiv: null }; try { const r = JSON.parse(localStorage.getItem(T_KULCS) || 'null'); if (r) { r.id = 'k1'; r.nev = r.nev || 'Első kampány'; v.lista.push(r); v.aktiv = 'k1'; } } catch (e) {} }
      return v; },
    set(v) { try { localStorage.setItem(KAMP, JSON.stringify(v)); } catch (e) {} } };
  const tar = { get() { const v = kamp.get(); return v.lista.find(k => k.id === v.aktiv) || null; },
                set(t) { const v = kamp.get(); t.id = 'k' + Date.now(); v.lista.unshift(t); v.aktiv = t.id; kamp.set(v); },
                valaszt(id) { const v = kamp.get(); v.aktiv = id; kamp.set(v); } };

  const EVSZAK = ['tel', 'tel', 'tavasz', 'tavasz', 'tavasz', 'nyar', 'nyar', 'nyar', 'osz', 'osz', 'osz', 'tel'];
  const EVSZAK_NEV = { tel: 'tél', tavasz: 'tavasz', nyar: 'nyár', osz: 'ősz' };
  const NAPOK = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  // Heti ritmus: melyik napokon (0 = vasárnap). Hétvége délelőtt, hétköznap este – ilyenkor görgetnek a legtöbben (AI-javaslat, mérés felülírja).
  const RITMUS = { 2: [2, 6], 3: [1, 3, 6], 5: [1, 2, 3, 4, 6] };
  const ido = (nap) => (nap === 0 || nap === 6) ? '10:00' : '19:00';
  const evszak = (d) => EVSZAK[d.getMonth()];

  // Témák sorrendje: a ház és a környék váltja egymást, hogy ne legyen egyhangú.
  function temaSor() {
    const t = (K.temak || []).filter(x => x && x.id);
    const haz = t.filter(x => x.haz), kor = t.filter(x => !x.haz), out = [];
    for (let i = 0; i < Math.max(haz.length, kor.length); i++) { if (haz[i]) out.push(haz[i]); if (kor[i]) out.push(kor[i]); }
    return out;
  }
  // Van-e kész anyag (mondatminta) a témához ebben az évszakban – ha nincs, ez a téma most fotót kér.
  function vanAnyag(tema, ev) {
    return (K.mintak || []).some(m => m.tema === tema && (!m.evszak || m.evszak === ev));
  }
  // Vevőút: a cél szerint súlyozva; minden 3. poszt lép közelebb a cselekvéshez, a többi figyelmet és bizalmat épít.
  const MINTA = [0, 1, 0, 2, 1, 3];
  function vevoutLepes(i) {
    const v = SZ.vevout || ['meglát', 'elképzeli magát ott', 'megnézi', 'ír vagy foglal'];
    return v[MINTA[i % 6]] || v[0];
  }
  // Hívás (link a foglalásra) csak a „megnézi” és „ír vagy foglal” lépésnél – a figyelemkeltő poszt nem árul.
  const vanHivas = (i) => MINTA[i % 6] >= 2;

  function naptar(beall, ma) {
    const start = new Date(ma || Date.now()); start.setHours(12, 0, 0, 0);
    const napok = RITMUS[beall.heti] || RITMUS[3];
    const sor = temaSor(); const helyek = [], foto = new Map();
    let j = 0;
    for (let d = 1; d <= 28; d++) {
      const nap = new Date(start); nap.setDate(start.getDate() + d);
      if (!napok.includes(nap.getDay())) continue;
      const ev = evszak(nap);
      let tema = sor.length ? sor[j % sor.length] : null, csere = false;
      // Képtartalék: ha a témához nincs anyag, az első olyan téma jön, amihez van; az eredeti fotókérésbe kerül.
      if (tema && !vanAnyag(tema.id, ev)) {
        foto.set(tema.id, { tema: tema.nev, mit: `${tema.nev} – ${EVSZAK_NEV[ev]}i fotó`, tipus: 'kérés' });
        const k = sor.find((x, n) => n > j % sor.length && vanAnyag(x.id, ev)) || sor.find(x => vanAnyag(x.id, ev));
        if (k) { tema = k; csere = true; }
      }
      const i = helyek.length;
      helyek.push({ datum: nap.toISOString().slice(0, 10), nap: NAPOK[nap.getDay()], ido: ido(nap.getDay()),
                    tema: tema ? tema.id : '', temaNev: tema ? tema.nev : '—', lepes: vevoutLepes(i),
                    cta: vanHivas(i), evszak: ev, csere });
      j++;
    }
    // Fotólista a szakmából: teljesíthető, nem időjárásfüggő kérések; időjárás csak lehetőségként.
    for (const f of (SZ.fotolista || []).slice(0, 4)) foto.set('sz-' + f, { mit: f, tipus: 'kérés' });
    foto.set('lehetoseg', { mit: 'Ha köd, hó vagy különleges fény jön: egy kép ugyanarról a nézetről (nem kötelező)', tipus: 'lehetőség' });
    const ev0 = helyek.length ? EVSZAK_NEV[helyek[0].evszak] : '';
    const nev = `${ev0.charAt(0).toUpperCase() + ev0.slice(1)} · ${beall.cel} · ${helyek.length ? helyek[0].datum.slice(5).replace('-', '.') + '-tól' : ''}`;
    return { nev, beall, keszult: new Date().toISOString().slice(0, 10), helyek, foto: [...foto.values()] };
  }

  const chipek = (hova, lista, kulcs) => {
    const el = $(hova); el.textContent = '';
    for (const v of lista) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = v;
      b.setAttribute('aria-pressed', String(allapot[kulcs] === v));
      b.addEventListener('click', () => { allapot[kulcs] = v; chipek(hova, lista, kulcs); gombFriss(); });
      el.append(b);
    }
  };
  const allapot = { cel: null, kinek: null, heti: null };
  const DEMO_VAN = (t) => !!(typeof DEMO !== 'undefined' && DEMO[t]);
  const gombFriss = () => { $('tervKeszit').disabled = !(allapot.cel && allapot.kinek && allapot.heti); };

  // Teljesült-e: van-e kint poszt ugyanarról a témáról ±3 napon belül; ha nincs és elmúlt a nap: elmaradt.
  function statusz(p, ma) {
    const t = new Date(p.datum).getTime(), most = ma ? new Date(ma).getTime() : Date.now();
    const k = (typeof kint !== 'undefined' ? kint.get() : []).some(x => x.tema === p.tema && Math.abs(new Date(x.datum).getTime() - t) <= 3 * 864e5);
    if (k) return 'kint';
    return t < most - 864e5 ? 'elmaradt' : 'esedekes';
  }
  function rajzol(terv) {
    const el = $('tervLista'); el.textContent = '';
    if (!terv) { el.hidden = true; return; }
    el.hidden = false;
    const v = kamp.get();
    if (v.lista.length > 1) { const w = document.createElement('div'); w.className = 'row'; w.id = 'kampValaszt';
      for (const k of v.lista) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = k.nev || 'Kampány';
        b.setAttribute('aria-pressed', String(k.id === v.aktiv)); b.addEventListener('click', () => { tar.valaszt(k.id); rajzol(tar.get()); }); w.append(b); }
      el.append(w); }
    const h = document.createElement('h3'); h.textContent = `${terv.nev || 'Kampány'} · ${terv.beall.kinek} · heti ${terv.beall.heti}`; el.append(h);
    let het = -1;
    terv.helyek.forEach((p, i) => {
      const w = Math.floor((new Date(p.datum) - new Date(terv.helyek[0].datum)) / 6048e5);
      if (w !== het) { het = w; const t = document.createElement('p'); t.className = 'note'; t.textContent = `${w + 1}. hét`; el.append(t); }
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tervsor';
      b.innerHTML = '<b></b><span></span><small></small>';
      b.children[0].textContent = `${p.datum.slice(5).replace('-', '.')} ${p.nap} ${p.ido}`;
      const sz = statusz(p); b.dataset.st = sz; b.children[0].textContent += ' · ' + ({ kint: '✓ kint', esedekes: 'esedékes', elmaradt: 'elmaradt' })[sz];
      b.children[1].textContent = p.temaNev + (p.cta ? ' · hívás a foglalásra' : '');
      b.children[2].textContent = `Vevőút: ${p.lepes}` + (p.csere ? ' · képtartalék (az eredeti témához fotó kell)' : '');
      b.addEventListener('click', () => { try { modValt('poszt'); lep(1); if (p.tema && !(window.__terv.demoBetolt && DEMO_VAN(p.tema))) temaValaszt(p.tema); else if (p.tema) window.__terv.demoBetolt(p.tema); } catch (e) {} });
      el.append(b);
    });
    const fh = document.createElement('h3'); fh.textContent = 'Fotók, amiket kérünk'; el.append(fh);
    const ul = document.createElement('ul'); ul.className = 'tervfoto';
    for (const f of terv.foto) { const li = document.createElement('li'); li.textContent = (f.tipus === 'lehetőség' ? 'Ha arra jársz: ' : '') + f.mit; ul.append(li); }
    el.append(ul);
  }

  function modValt(mod) {
    const terv = mod !== 'poszt';
    $('terv').hidden = mod !== 'terv';
    if ($('ered')) { $('ered').hidden = mod !== 'ered'; if (mod === 'ered') eredmenyRajzol(); }
    $('lepsor').hidden = terv;
    for (const s of document.querySelectorAll('.lepes')) s.hidden = terv ? true : +s.dataset.l !== ((window.__test && window.__test.S && window.__test.S.lep) || 1);
    for (const b of document.querySelectorAll('#modok button')) b.setAttribute('aria-pressed', String(b.dataset.mod === mod));
  }

  function indit() {
    if (!$('terv')) return;
    chipek('tervCel', SZ.celok || ['foglalás', 'üzenet'], 'cel');
    chipek('tervKinek', SZ.celcsoportok || ['mindenki'], 'kinek');
    chipek('tervHeti', ['2', '3', '5'], 'heti');
    $('tervKeszit').addEventListener('click', () => {
      const t = naptar({ cel: allapot.cel, kinek: allapot.kinek, heti: +allapot.heti }); tar.set(t); rajzol(tar.get());
      $('tervSt').textContent = 'Új kampány kész. Egy sorra koppintva elkészítheted azt a posztot. A korábbi kampányaid fent választhatók.';
    });
    for (const b of document.querySelectorAll('#modok button')) b.addEventListener('click', () => modValt(b.dataset.mod));
    const t = tar.get(); if (t) { Object.assign(allapot, { cel: t.beall.cel, kinek: t.beall.kinek, heti: String(t.beall.heti) });
      chipek('tervCel', SZ.celok || [], 'cel'); chipek('tervKinek', SZ.celcsoportok || [], 'kinek'); chipek('tervHeti', ['2', '3', '5'], 'heti'); rajzol(t); }
    gombFriss();
  }
  // Ügyfél-arculat (ügyfélcsomag ceg.arculat): márkaszín, név, jelmondat – a motor nem változik.
  function arculat() {
    const c = K.ceg || {}, a = c.arculat; if (!a) return;
    const sotet = matchMedia('(prefers-color-scheme: dark)');
    const fest = () => { document.documentElement.style.setProperty('--deep', sotet.matches ? (a.fo_sotet || a.fo) : a.fo); };
    fest(); try { sotet.addEventListener('change', fest); } catch (e) {}
    if ($('fejCim')) $('fejCim').textContent = c.nev || $('fejCim').textContent;
    if ($('fejAl') && a.jelmondat) $('fejAl').textContent = a.jelmondat;
    if ($('fejLogo') && c.logobetu) $('fejLogo').textContent = c.logobetu;
  }
  arculat();
  // A kiválasztott fotó a 2–4. lépésnél is látszik (Péter, 11-27: „eltűnik a kép”).
  function miniFriss() {
    const m = $('miniFoto'), pv = $('prev'); if (!m || !pv) return;
    const l = (window.__test && window.__test.S && window.__test.S.lep) || 1, poszt = !$('lepsor').hidden;
    const van = pv.src && !pv.hidden;
    m.hidden = !(poszt && l >= 2 && van);
    if (!m.hidden) { let im = m.querySelector('img'); if (!im) { im = document.createElement('img'); im.alt = 'A kiválasztott fotó'; m.prepend(im); } if (im.src !== pv.src) im.src = pv.src;
      const t = document.querySelector('#temak .chip[aria-pressed=true]'); m.querySelector('span').textContent = t ? 'Téma: ' + t.textContent : 'A fotód'; }
  }
  try { new MutationObserver(miniFriss).observe($('lepsor'), { attributes: true, subtree: true, attributeFilter: ['aria-current', 'hidden'] }); } catch (e) {}
  window.__terv = { naptar, temaSor, vanAnyag, evszak, modValt, statusz, kamp };
  // ── Eredmény (BEMUTATÓ): szimulált mérés a teszthez, amíg nincs Meta-bekötés. Minden szám jelölten nem valós.
  // A javaslatokat ugyanaz a program-szabály adja, ami élesben a valódi számokra fut (AI nélkül).
  function mag(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1000) / 1000; }
  function szimulal(terv) {
    const sorok = (terv && terv.helyek.length ? terv.helyek : temaSor().slice(0, 8).map((t, i) => ({ tema: t.id, temaNev: t.nev, cta: i % 3 === 2, lepes: vevoutLepes(i) })));
    return sorok.map((p, i) => { const r = mag(p.tema + i);
      const eleres = Math.round(180 + r() * 900 * (p.tema && /kilatas|duna|naplemente|havas/.test(p.tema) ? 1.6 : 1));
      return { ...p, eleres, reakcio: Math.round(eleres * (0.03 + r() * 0.05)), kattintas: p.cta ? Math.round(eleres * (0.005 + r() * 0.02)) : 0 }; });
  }
  function javaslatok(m) {
    if (!m.length) return [];
    const temak = {}; for (const p of m) (temak[p.temaNev] = temak[p.temaNev] || []).push(p.eleres);
    const atl = Object.entries(temak).map(([t, l]) => [t, l.reduce((a, b) => a + b, 0) / l.length]).sort((a, b) => b[1] - a[1]);
    const ossz = m.reduce((a, p) => a + p.eleres, 0) / m.length, out = [];
    if (atl[0]) out.push(`Több ilyen: „${atl[0][0]}” posztjai érték el a legtöbb embert (átlag ${Math.round(atl[0][1])}, az összátlag ${Math.round(ossz)}).`);
    const gyenge = atl[atl.length - 1];
    if (gyenge && gyenge[1] < ossz * 0.7) out.push(`Másik fotóval próbáld: „${gyenge[0]}” elmaradt az átlagtól (${Math.round(gyenge[1])}).`);
    const k = m.filter(p => p.cta), kk = k.reduce((a, p) => a + p.kattintas, 0);
    if (k.length) out.push(`A foglalási linkre ${kk} kattintás jött ${k.length} posztból.`);
    return out;
  }
  function eredmenyRajzol() {
    const el = $('eredLista'); if (!el) return; el.textContent = '';
    const v = kamp.get();
    const ma = Date.now(), het = ma + 7 * 864e5;
    if (!v.lista.length) { const p = document.createElement('p'); p.className = 'note'; p.textContent = 'Még nincs kampány. A Terv fülön három kérdéssel készíthetsz egyet.'; el.append(p); }
    for (const k of v.lista) {
      const m = szimulal(k), st = k.helyek.map(p => statusz(p));
      const nKint = st.filter(x => x === 'kint').length, nEl = st.filter(x => x === 'elmaradt').length;
      const nJon = k.helyek.filter((p, i) => st[i] === 'esedekes' && new Date(p.datum).getTime() <= het).length;
      const cel = k.beall.cel, celSzamNev = (SZ.cel_szam || {})[cel] || 'kattintás';
      const celSzam = cel === 'érdeklődés' ? m.reduce((a, p) => a + p.kattintas + Math.round(p.reakcio * 0.1), 0) : m.reduce((a, p) => a + p.kattintas, 0);
      const c = document.createElement('div'); c.className = 'kampkartya'; if (k.id === v.aktiv) c.dataset.aktiv = '1';
      const h = document.createElement('h3'); h.textContent = k.nev || 'Kampány'; c.append(h);
      const al = document.createElement('p'); al.className = 'note'; al.textContent = `Cél: ${cel} · ${k.beall.kinek} · heti ${k.beall.heti}`; c.append(al);
      const hal = document.createElement('p'); hal.className = 'kampszam'; hal.textContent = `${nKint} / ${k.helyek.length} poszt kint`; c.append(hal);
      const hal2 = document.createElement('p'); hal2.className = 'note'; hal2.textContent = `${nEl} elmaradt · ${nJon} jön a héten`; c.append(hal2);
      const cs = document.createElement('p'); cs.className = 'kampszam'; cs.textContent = `${celSzam} ${celSzamNev}`; c.append(cs);
      const cs2 = document.createElement('p'); cs2.className = 'note'; cs2.textContent = 'a cél-szám (bemutató: mintha a kampány lefutott volna)'; c.append(cs2);
      const j = javaslatok(m)[0]; if (j) { const jp = document.createElement('p'); jp.className = 'javaslat'; jp.textContent = 'Javaslat: ' + j; c.append(jp); }
      const d = document.createElement('details'); const sm = document.createElement('summary'); sm.textContent = 'Részletek'; d.append(sm);
      m.forEach((p, i) => { const r = document.createElement('div'); r.className = 'tervsor';
        r.innerHTML = '<b></b><span></span>'; r.children[0].textContent = `${p.datum.slice(5).replace('-', '.')} ${p.temaNev} · ` + ({ kint: '✓ kint', esedekes: 'esedékes', elmaradt: 'elmaradt' })[st[i]];
        r.children[1].textContent = `${p.eleres} elérés · ${p.reakcio} reakció` + (p.cta ? ` · ${p.kattintas} kattintás` : ''); d.append(r); });
      c.append(d); el.append(c);
    }
    const kk = kint.get().filter(x => !v.lista.some(k => k.helyek.some(p => statusz(p) === 'kint' && p.tema === x.tema)));
    if (kk.length) { const d = document.createElement('details'); const sm = document.createElement('summary'); sm.textContent = `Kampányon kívüli posztok (${kk.length})`; d.append(sm);
      for (const p of kk) { const r = document.createElement('div'); r.className = 'tervsor'; r.textContent = `✓ ${p.datum.slice(5).replace('-', '.')} ${p.temaNev}`; d.append(r); }
      el.append(d); }
  }
  // ── BEMUTATÓ képtár: a teszthez témánként egy kész fotó (bemutato/lista.json), egy koppintással betölthető.
  let DEMO = {};
  fetch('bemutato/lista.json').then(r => r.ok ? r.json() : {}).then(j => { DEMO = (j && j.kepek) || {}; demoGombok(); }).catch(() => {});
  async function demoBetolt(tema) {
    const d = DEMO[tema]; if (!d) return false;
    try {
      const b = await (await fetch('bemutato/' + d.fajl)).blob();
      const f = new File([b], 'bemutato-' + d.fajl, { type: 'image/jpeg', lastModified: Date.now() });
      const dt = new DataTransfer(); dt.items.add(f); const inp = $('file'); inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true })); setTimeout(() => { try { temaValaszt(tema); } catch (e) {} }, 400);
      return true;
    } catch (e) { return false; }
  }
  function demoGombok() {
    const el = $('demoKepek'); if (!el) return; el.textContent = '';
    const temak = (K.temak || []).filter(t => DEMO[t.id]);
    $('demoW').hidden = !temak.length;
    for (const t of temak) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t.nev;
      b.addEventListener('click', () => demoBetolt(t.id)); el.append(b); }
  }
  window.__terv.demoBetolt = demoBetolt;
  // Szimulált kiküldés: a poszt témája és ideje a „kint” listába; az Eredmény ezeket is mutatja.
  const KINT = 'akvposzt-kint';
  const kint = { get() { try { return JSON.parse(localStorage.getItem(KINT) || '[]'); } catch (e) { return []; } },
                 add(x) { try { const l = kint.get(); l.unshift(x); localStorage.setItem(KINT, JSON.stringify(l.slice(0, 50))); } catch (e) {} } };
  if ($('demoKi')) $('demoKi').addEventListener('click', () => {
    const tid = ((document.querySelector('#temak .chip[aria-pressed=true]') || {}).dataset || {}).t || '';
    const t = (K.temak || []).find(x => x.id === tid) || {};
    const szoveg = ($('kom') && $('kom').value) || '';
    kint.add({ datum: new Date().toISOString().slice(0, 10), tema: tid, temaNev: t.nev || 'poszt', cta: /https?:\/\//.test(szoveg), lepes: 'kiment', kint: true });
    $('demoKiSt').textContent = 'Kiment (bemutató). Nézd meg az Eredmény fülön.';
  });
  window.__terv.kint = kint;
  window.__terv.szimulal = szimulal; window.__terv.javaslatok = javaslatok;
  indit();
})();
