// Tervező (ZSEBMARKETING, 11-27): cél → kinek → milyen gyakran → 4 hetes posztnaptár + teljesíthető fotókérések.
// AI nélkül: a szakmacsomag (K.szakma) és az ügyfélcsomag (K.temak, K.mintak) adataiból program számol.
// Helyzetkép: évszak és napszak a dátumból; képtartalék: témához nincs anyag → szomszéd téma, a fotókérés listára kerül.
(() => {
  const $ = (id) => document.getElementById(id);
  const K = JSON.parse($('keszlet').textContent);
  const SZ = K.szakma || {};
  const T_KULCS = 'akvposzt-terv';
  const tar = { get() { try { return JSON.parse(localStorage.getItem(T_KULCS) || 'null'); } catch (e) { return null; } },
                set(v) { try { localStorage.setItem(T_KULCS, JSON.stringify(v)); } catch (e) {} } };

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
    return { beall, keszult: new Date().toISOString().slice(0, 10), helyek, foto: [...foto.values()] };
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

  function rajzol(terv) {
    const el = $('tervLista'); el.textContent = '';
    if (!terv) { el.hidden = true; return; }
    el.hidden = false;
    const h = document.createElement('h3'); h.textContent = `4 hetes terv · cél: ${terv.beall.cel} · ${terv.beall.kinek} · heti ${terv.beall.heti}`; el.append(h);
    let het = -1;
    terv.helyek.forEach((p, i) => {
      const w = Math.floor((new Date(p.datum) - new Date(terv.helyek[0].datum)) / 6048e5);
      if (w !== het) { het = w; const t = document.createElement('p'); t.className = 'note'; t.textContent = `${w + 1}. hét`; el.append(t); }
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tervsor';
      b.innerHTML = '<b></b><span></span><small></small>';
      b.children[0].textContent = `${p.datum.slice(5).replace('-', '.')} ${p.nap} ${p.ido}`;
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
    for (const s of document.querySelectorAll('.lepes')) s.hidden = terv ? true : +s.dataset.l !== ((typeof S !== 'undefined' && S.lep) || 1);
    for (const b of document.querySelectorAll('#modok button')) b.setAttribute('aria-pressed', String(b.dataset.mod === mod));
  }

  function indit() {
    if (!$('terv')) return;
    chipek('tervCel', SZ.celok || ['foglalás', 'üzenet'], 'cel');
    chipek('tervKinek', SZ.celcsoportok || ['mindenki'], 'kinek');
    chipek('tervHeti', ['2', '3', '5'], 'heti');
    $('tervKeszit').addEventListener('click', () => {
      const t = naptar({ cel: allapot.cel, kinek: allapot.kinek, heti: +allapot.heti }); tar.set(t); rajzol(t);
      $('tervSt').textContent = 'Kész a terv. Egy sorra koppintva elkészítheted azt a posztot.';
    });
    for (const b of document.querySelectorAll('#modok button')) b.addEventListener('click', () => modValt(b.dataset.mod));
    const t = tar.get(); if (t) { Object.assign(allapot, { cel: t.beall.cel, kinek: t.beall.kinek, heti: String(t.beall.heti) });
      chipek('tervCel', SZ.celok || [], 'cel'); chipek('tervKinek', SZ.celcsoportok || [], 'kinek'); chipek('tervHeti', ['2', '3', '5'], 'heti'); rajzol(t); }
    gombFriss();
  }
  window.__terv = { naptar, temaSor, vanAnyag, evszak, modValt };
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
    const m = [...szimulal(kint.get().length ? { helyek: kint.get() } : null).filter(() => kint.get().length), ...szimulal(tar.get())];
    const jl = document.createElement('div'); jl.className = 'javaslat';
    const jh = document.createElement('h3'); jh.textContent = 'Javaslat'; jl.append(jh);
    for (const j of javaslatok(m)) { const p = document.createElement('p'); p.textContent = j; jl.append(p); }
    el.append(jl);
    for (const p of m) { const d = document.createElement('div'); d.className = 'tervsor';
      d.innerHTML = '<b></b><span></span>'; d.children[0].textContent = (p.kint ? '✓ kiment · ' : '') + (p.datum ? p.datum.slice(5).replace('-', '.') + ' ' : '') + p.temaNev;
      d.children[1].textContent = `${p.eleres} elérés · ${p.reakcio} reakció` + (p.cta ? ` · ${p.kattintas} kattintás` : ''); el.append(d); }
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
