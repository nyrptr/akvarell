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
      b.addEventListener('click', () => { try { modValt('poszt'); if (p.tema) temaValaszt(p.tema); lep(1); } catch (e) {} });
      el.append(b);
    });
    const fh = document.createElement('h3'); fh.textContent = 'Fotók, amiket kérünk'; el.append(fh);
    const ul = document.createElement('ul'); ul.className = 'tervfoto';
    for (const f of terv.foto) { const li = document.createElement('li'); li.textContent = (f.tipus === 'lehetőség' ? 'Ha arra jársz: ' : '') + f.mit; ul.append(li); }
    el.append(ul);
  }

  function modValt(mod) {
    const terv = mod === 'terv';
    $('terv').hidden = !terv;
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
  indit();
})();
