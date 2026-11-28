// Vágó – saját videóklipekből reel, a telefonon, AI nélkül (Péter 11-28: „a létező legprofibb legyen;
// ha lehet, a videón én jelölöm ki a részt, ha nem, magától”).
// Szakmai alap: 1080×1920 (9:16), 30 fps, H.264/MP4 ahol a böngésző tudja; Reels biztonsági sáv:
// felül 14%, alul 35%, oldalt 6% szabadon (Meta Reels-hirdetési előírás) – felirat és adat csak a közepén.
// Kiválasztás: a klipet 0,5 mp-enként mintázza (élesség = Laplace-variancia, mozgás = képkocka-különbség, fény);
// a legjobb ablakot választja, a legerősebb klip kerül előre (első 3 mp). Kézzel: a filmcsíkon húzható ablak.
// Az eredeti klip sosem módosul.
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const gomb = (x, c, f) => { const b = el('button', c, x); b.type = 'button'; b.addEventListener('click', f); return b; };
  const K = (() => { try { return JSON.parse($('keszlet').textContent); } catch (e) { return {}; } })();
  const W = 1080, H = 1920, SAV = { fel: 0.14, le: 0.35, old: 0.06 };
  const KLIPEK = []; let azon = 0;
  const all = { hossz: 25, hang: 'eredeti', fekvo: 'elmos', eros: true, adat: '', zaroNev: '', zaroWeb: '' };

  // ── UI
  function hely() {
    let w = $('vago'); if (w) return w;
    w = el('div', 'vago'); w.id = 'vago'; w.hidden = true;
    const kw = $('klipW'); (kw ? kw.after(w) : $('kep').append(w));
    w.innerHTML = '';
    w.append(el('h3', null, 'Vágó – reel a saját videóidból'));
    w.append(el('p', 'note', 'Tedd be a klipjeidet (bármilyen hosszú, álló vagy fekvő). A legjobb részt magától kiválasztja – a csíkon húzással te is kijelölheted.'));
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'video/*'; inp.multiple = true; inp.hidden = true; inp.id = 'vagoFile';
    inp.addEventListener('change', () => { for (const f of inp.files) hozzaad(URL.createObjectURL(f), f.name); inp.value = ''; });
    w.append(inp, gomb('+ Klipek a telefonról', 'btn full', () => inp.click()));
    const vl = el('div'); vl.id = 'vagoLista'; w.append(vl);
    const b = el('details', 'vagoBeall'); b.id = 'vagoBeall';
    b.append(el('summary', null, 'Beállítások: 25 mp · eredeti hang · fekvő: elmosott háttér ›'));
    const chips = (cim, kulcs, opc) => { b.append(el('p', 'note', cim)); const r = el('div', 'row');
      for (const [v, t] of opc) { const c = gomb(t, 'chip', () => { all[kulcs] = v; for (const x of r.children) x.setAttribute('aria-pressed', String(x === c)); osszegFriss(); allapot(); });
        c.setAttribute('aria-pressed', String(all[kulcs] === v)); r.append(c); } b.append(r); };
    chips('A reel hossza', 'hossz', [[15, '15 mp'], [25, '25 mp'], [30, '30 mp']]);
    chips('Hang', 'hang', [['eredeti', 'Eredeti hang'], ['nema', 'Néma']]);
    chips('Fekvő videó', 'fekvo', [['elmos', 'Elmosott háttér'], ['vag', 'Kivágás középen']]);
    chips('Sorrend', 'eros', [[true, 'A legerősebb elöl'], [false, 'Ahogy én raktam']]);
    const mezo = (cim, kulcs, ph) => { b.append(el('p', 'note', cim)); const i = document.createElement('input'); i.type = 'text'; i.placeholder = ph; i.value = all[kulcs];
      i.addEventListener('input', () => { all[kulcs] = i.value; }); b.append(i); };
    mezo('Adat a képen (forrással, ha szám) – pl. „Nagymaros vízállás 312 cm · HydroInfo, 11.28 14:00”', 'adat', 'üresen hagyható');
    mezo('Záró kép: név', 'zaroNev', (K.ceg && (K.ceg.rovid || K.ceg.nev)) || 'név');
    mezo('Záró kép: web vagy kulcsszó', 'zaroWeb', 'pl. veledaholnapert.hu');
    w.append(b);
    const rb = gomb('Reel készítése', 'btn full', reel); rb.id = 'vagoReel'; w.append(rb);
    const st = el('div', 'status'); st.id = 'vagoSt'; st.setAttribute('role', 'status'); w.append(st);
    const ki = el('div'); ki.id = 'vagoKi'; ki.hidden = true; w.append(ki);
    allapot();
    return w;
  }
  const osszegFriss = () => { const s = $('vagoBeall'); if (s) s.firstChild.textContent = `Beállítások: ${all.hossz} mp · ${all.hang === 'eredeti' ? 'eredeti hang' : 'néma'} · fekvő: ${all.fekvo === 'elmos' ? 'elmosott háttér' : 'kivágás'} ›`; };
  const mp = (x) => x.toFixed(1).replace('.', ',');
  function allapot() {
    const st = $('vagoSt'), b = $('vagoReel'); if (!st || !b) return;
    b.disabled = !KLIPEK.length || KLIPEK.some(k => !k.kesz);
    const ossz = KLIPEK.reduce((a, k) => a + (k.ki - k.be), 0);
    st.textContent = !KLIPEK.length ? 'Még nincs klip.' : KLIPEK.some(k => !k.kesz) ? 'Elemzem a klipeket…' : `${KLIPEK.length} klip · a reel kb. ${Math.round(ossz + 2)} mp (+ 2 mp záró kép).`;
  }
  function celHossz() { const n = Math.max(1, KLIPEK.length); return Math.max(2, Math.min(9, (all.hossz - 2) / n)); }

  // ── Fogadás és elemzés
  async function hozzaad(url, nev) {
    hely(); const k = { id: ++azon, url, nev: nev || 'klip', dur: 0, w: 0, h: 0, minta: [], be: 0, ki: 0, kezi: false, kesz: false, felirat: '' };
    KLIPEK.push(k); rajz(); allapot();
    try { await elemez(k); } catch (e) { k.hiba = 'Ezt a videót nem tudom megnyitni.'; }
    k.kesz = true; ujraoszt(); rajz(); allapot();
  }
  // a kép a dekódolás után frissül: requestVideoFrameCallback, ha van; különben rövid várakozás
  const kocka = (v) => new Promise((r) => { if (v.requestVideoFrameCallback) { let k = false; v.requestVideoFrameCallback(() => { k = true; r(); }); setTimeout(() => { if (!k) r(); }, 120); } else setTimeout(r, 60); });
  const varj = (v, ev) => new Promise((r) => { const f = () => { v.removeEventListener(ev, f); r(); }; v.addEventListener(ev, f); setTimeout(f, 4000); });
  async function elemez(k) {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = k.url;
    await varj(v, 'loadedmetadata'); k.dur = v.duration || 0; k.w = v.videoWidth; k.h = v.videoHeight;
    const cw = 54, ch = 96, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const g = cv.getContext('2d', { willReadFrequently: true });
    const tw = 90, th = 160, tc = document.createElement('canvas'); tc.width = tw; tc.height = th; const tg = tc.getContext('2d');
    const lepes = k.dur > 40 ? k.dur / 80 : 0.5; let elozo = null;
    for (let t = 0.05; t < k.dur; t += lepes) {
      v.currentTime = t; await varj(v, 'seeked'); await kocka(v);
      fedo(g, v, cw, ch, false); const d = g.getImageData(0, 0, cw, ch).data, gr = new Float32Array(cw * ch);
      let fs = 0; for (let i = 0; i < gr.length; i++) { gr[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; fs += gr[i]; }
      let lap = 0, n = 0; for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) { const i = y * cw + x; const l = 4 * gr[i] - gr[i - 1] - gr[i + 1] - gr[i - cw] - gr[i + cw]; lap += l * l; n++; }
      let mozg = 0; if (elozo) { for (let i = 0; i < gr.length; i++) mozg += Math.abs(gr[i] - elozo[i]); mozg /= gr.length; }
      elozo = gr; const feny = fs / gr.length;
      const kep = (k.minta.length % Math.max(1, Math.round(k.dur / lepes / 10)) === 0) ? (fedo(tg, v, tw, th, false), tc.toDataURL('image/jpeg', 0.6)) : null;
      k.minta.push({ t, eles: lap / n, mozg, feny, kep });
    }
    v.removeAttribute('src'); v.load();
  }
  // Pontszám egy időpontra: élesség (normálva), mérsékelt mozgás jó, rázkódás és sötét/kiégett kép rossz
  function pont(k, m) {
    const maxE = Math.max(...k.minta.map(x => x.eles), 1);
    const e = m.eles / maxE, mz = m.mozg, fe = m.feny;
    const mozgJo = mz < 1.5 ? 0.3 : mz < 18 ? 1 : Math.max(0, 1 - (mz - 18) / 20);
    const fenyJo = fe < 45 ? 0.3 : fe > 215 ? 0.4 : 1;
    return 0.5 * e + 0.3 * mozgJo + 0.2 * fenyJo;
  }
  function legjobb(k, L) {
    if (k.dur <= L || k.minta.length < 2) return [0, Math.min(k.dur, L)];
    let jo = 0, jt = 0;
    for (let s = 0; s + L <= k.dur + 0.01; s += 0.5) {
      const ab = k.minta.filter(m => m.t >= s && m.t <= s + L); if (!ab.length) continue;
      const p = ab.reduce((a, m) => a + pont(k, m), 0) / ab.length - (s < 0.4 ? 0.05 : 0); // az első tized mp gyakran rázkódik
      if (p > jo) { jo = p; jt = s; }
    }
    return [jt, Math.min(k.dur, jt + L)];
  }
  function klipPont(k) { const ab = k.minta.filter(m => m.t >= k.be && m.t <= k.ki); return ab.length ? ab.reduce((a, m) => a + pont(k, m), 0) / ab.length : 0; }
  function ujraoszt() { const L = celHossz(); for (const k of KLIPEK) if (k.kesz !== false && !k.kezi && k.minta.length) [k.be, k.ki] = legjobb(k, L); }

  // ── Klip-kártyák: filmcsík, húzható ablak, előnézet, felirat
  function rajz() {
    const l = $('vagoLista'); if (!l) return; l.textContent = '';
    KLIPEK.forEach((k, ix) => {
      const c = el('div', 'kartya vagoKlip'); c.dataset.id = k.id;
      const fej = el('div', 'vagoFej'); fej.append(el('b', null, `${ix + 1}. klip`), el('small', null, k.hiba || (k.kesz ? `${mp(k.dur)} mp · ${k.h >= k.w ? 'álló' : 'fekvő'} · kiválasztva: ${mp(k.be)}–${mp(k.ki)} mp (${mp(k.ki - k.be)} mp)${k.kezi ? ' · kézzel' : ' · magától'}` : 'elemzem…')));
      c.append(fej);
      if (k.kesz && !k.hiba) {
        const cs = el('div', 'csik'); cs.setAttribute('aria-label', 'Húzd az ablakot, vagy a szélét a kijelöléshez');
        const kepek = k.minta.filter(m => m.kep); for (const m of kepek) { const i = document.createElement('img'); i.src = m.kep; i.alt = ''; cs.append(i); }
        const ab = el('div', 'ablak'); const bal = el('span', 'fogo bal'), jobb = el('span', 'fogo jobb'); ab.append(bal, jobb); cs.append(ab);
        const pos = () => { ab.style.left = (k.be / k.dur * 100) + '%'; ab.style.width = ((k.ki - k.be) / k.dur * 100) + '%'; };
        pos(); huzas(cs, ab, bal, jobb, k, () => { pos(); fej.lastChild.textContent = `${mp(k.dur)} mp · kiválasztva: ${mp(k.be)}–${mp(k.ki)} mp (${mp(k.ki - k.be)} mp) · kézzel`; allapot(); });
        c.append(cs);
        const v = document.createElement('video'); v.src = k.url + '#t=' + k.be; v.muted = true; v.playsInline = true; v.className = 'vagoElo'; v.preload = 'metadata';
        v.addEventListener('timeupdate', () => { if (v.currentTime >= k.ki || v.currentTime < k.be - 0.3) v.currentTime = k.be; });
        const pb = gomb('▶ A kijelölt rész', 'btn sec', () => { if (v.paused) { v.currentTime = k.be; v.play().catch(() => {}); pb.textContent = '❚❚ Megállítás'; } else { v.pause(); pb.textContent = '▶ A kijelölt rész'; } });
        const ft = document.createElement('input'); ft.type = 'text'; ft.placeholder = 'Felirat ehhez a részhez (hang nélkül is érthető legyen)'; ft.value = k.felirat; ft.maxLength = 80;
        ft.addEventListener('input', () => { k.felirat = ft.value; });
        const sor = el('div', 'row');
        sor.append(gomb('Magától', 'chip', () => { k.kezi = false; [k.be, k.ki] = legjobb(k, celHossz()); rajz(); allapot(); }),
          gomb('▲', 'chip', () => { if (ix) { KLIPEK.splice(ix - 1, 0, KLIPEK.splice(ix, 1)[0]); rajz(); } }),
          gomb('▼', 'chip', () => { if (ix < KLIPEK.length - 1) { KLIPEK.splice(ix + 1, 0, KLIPEK.splice(ix, 1)[0]); rajz(); } }),
          gomb('Kiveszem', 'chip', () => { KLIPEK.splice(ix, 1); ujraoszt(); rajz(); allapot(); }));
        c.append(v, pb, ft, sor);
      }
      l.append(c);
    });
  }
  function huzas(cs, ab, bal, jobb, k, kesz) {
    let mod = null, x0 = 0, be0 = 0, ki0 = 0;
    const le = (e, m) => { e.preventDefault(); e.stopPropagation(); mod = m; x0 = e.clientX; be0 = k.be; ki0 = k.ki; cs.setPointerCapture(e.pointerId); };
    bal.addEventListener('pointerdown', (e) => le(e, 'bal')); jobb.addEventListener('pointerdown', (e) => le(e, 'jobb')); ab.addEventListener('pointerdown', (e) => le(e, 'mozgat'));
    cs.addEventListener('pointermove', (e) => {
      if (!mod) return; const d = (e.clientX - x0) / cs.clientWidth * k.dur, min = Math.min(1.5, k.dur);
      if (mod === 'mozgat') { const L = ki0 - be0; k.be = Math.max(0, Math.min(k.dur - L, be0 + d)); k.ki = k.be + L; }
      if (mod === 'bal') k.be = Math.max(0, Math.min(k.ki - min, be0 + d));
      if (mod === 'jobb') k.ki = Math.min(k.dur, Math.max(k.be + min, ki0 + d));
      k.kezi = true; kesz();
    });
    const fel = () => { mod = null; }; cs.addEventListener('pointerup', fel); cs.addEventListener('pointercancel', fel);
  }

  // ── Rajzolás a vászonra
  function fedo(g, v, w, h, elmos) {
    const sw = v.videoWidth, sh = v.videoHeight; if (!sw) return;
    const s = Math.max(w / sw, h / sh), dw = sw * s, dh = sh * s;
    if (!elmos || sh >= sw) { g.drawImage(v, (w - dw) / 2, (h - dh) / 2, dw, dh); return; }
    // fekvő: elmosott, sötétített háttér + teljes kép középen
    try { g.filter = 'blur(40px) brightness(0.6)'; } catch (e) {}
    g.drawImage(v, (w - dw) / 2, (h - dh) / 2, dw, dh);
    try { g.filter = 'none'; } catch (e) {}
    if (g.filter === undefined || g.filter === 'none') { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, w, h); }
    const s2 = w / sw, h2 = sh * s2; g.drawImage(v, 0, (h - h2) / 2 - h * 0.04, w, h2);
  }
  function tordel(g, t, max) { const sz = t.split(/\s+/), s = []; let a = ''; for (const x of sz) { const p = a ? a + ' ' + x : x; if (g.measureText(p).width > max && a) { s.push(a); a = x; } else a = p; } if (a) s.push(a); return s.slice(0, 3); }
  function felirat(g, t, al) {
    if (!t || al <= 0) return;
    const maxW = W * (1 - 2 * SAV.old) - 80; g.font = '600 56px Figtree, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const s = tordel(g, t, maxW - 60), lh = 70, bh = s.length * lh + 44, bw = Math.min(maxW, Math.max(...s.map(x => g.measureText(x).width)) + 80);
    const cy = H * (1 - SAV.le) - bh / 2 - 30; // a biztonsági sáv alsó határa fölött
    g.globalAlpha = al; g.fillStyle = 'rgba(20,24,28,.72)'; kerek(g, (W - bw) / 2, cy - bh / 2, bw, bh, 26); g.fill();
    g.fillStyle = '#fff'; s.forEach((x, i) => g.fillText(x, W / 2, cy - bh / 2 + 22 + lh * (i + 0.5))); g.globalAlpha = 1;
  }
  function adatSor(g, t) {
    if (!t) return; g.font = '600 34px Figtree, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const s = tordel(g, t, W * 0.8), lh = 44, bh = s.length * lh + 28, bw = Math.min(W * 0.86, Math.max(...s.map(x => g.measureText(x).width)) + 56), y = H * SAV.fel + 20;
    g.fillStyle = 'rgba(255,255,255,.9)'; kerek(g, (W - bw) / 2, y, bw, bh, 22); g.fill();
    g.fillStyle = '#1d2a33'; s.forEach((x, i) => g.fillText(x, W / 2, y + 14 + lh * (i + 0.5)));
  }
  function kerek(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ── Reel készítése
  async function reel() {
    const lista = KLIPEK.filter(k => k.kesz && !k.hiba); if (!lista.length) return;
    const sor = all.eros && lista.length > 1 ? (() => { const a = lista.slice(); const b = a.reduce((m, k) => klipPont(k) > klipPont(m) ? k : m, a[0]); return [b, ...a.filter(x => x !== b)]; })() : lista;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const mt = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    const st = $('vagoSt'); if (!mt || !cv.captureStream) { st.textContent = 'Ez a böngésző nem tud videót készíteni. Próbáld Chrome-ban vagy frissített Safariban.'; return; }
    $('vagoReel').disabled = true; st.textContent = 'Készítem… (kb. annyi ideig tart, amilyen hosszú a reel – maradj ezen a lapon)';
    const kep = cv.captureStream(30), savok = [...kep.getVideoTracks()];
    let ac = null, cel = null;
    if (all.hang === 'eredeti') { try { ac = new (window.AudioContext || window.webkitAudioContext)(); await ac.resume(); cel = ac.createMediaStreamDestination(); savok.push(...cel.stream.getAudioTracks()); } catch (e) { ac = null; } }
    const rec = new MediaRecorder(new MediaStream(savok), { mimeType: mt, videoBitsPerSecond: 8e6, audioBitsPerSecond: 128e3 }), ch = [];
    rec.ondataavailable = (e) => e.data.size && ch.push(e.data); rec.start(250);
    const szin = getComputedStyle(document.documentElement).getPropertyValue('--deep').trim() || '#2f4237';
    for (let i = 0; i < sor.length; i++) {
      const k = sor[i], v = document.createElement('video'); v.playsInline = true; v.src = k.url; v.muted = !ac; v.preload = 'auto';
      await varj(v, 'loadeddata'); v.currentTime = k.be; await varj(v, 'seeked');
      let erosito = null;
      if (ac) { try { const src = ac.createMediaElementSource(v); erosito = ac.createGain(); erosito.gain.value = 0; src.connect(erosito); erosito.connect(cel); } catch (e) {} }
      const L = k.ki - k.be;
      if (erosito) { const t = ac.currentTime; erosito.gain.setValueAtTime(0, t); erosito.gain.linearRampToValueAtTime(1, t + 0.25); erosito.gain.setValueAtTime(1, t + Math.max(0.3, L - 0.3)); erosito.gain.linearRampToValueAtTime(0, t + L); }
      await v.play().catch(() => { v.muted = true; return v.play().catch(() => {}); });
      await new Promise(r => { const f = () => {
        const t = v.currentTime - k.be;
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H); fedo(g, v, W, H, all.fekvo === 'elmos');
        if (i === 0 || all.adat) adatSor(g, all.adat);
        felirat(g, k.felirat, Math.min(1, t / 0.35, (L - t) / 0.35));
        const be = Math.min(1, t / 0.12), ki = Math.min(1, (L - t) / 0.12); const s = Math.min(be, ki); if (s < 1) { g.fillStyle = `rgba(0,0,0,${1 - Math.max(0, s)})`; g.fillRect(0, 0, W, H); }
        if (t < L && !v.ended) requestAnimationFrame(f); else { v.pause(); r(); } }; requestAnimationFrame(f); });
    }
    // Záró kép: név + web/kulcsszó, a biztonsági sávban
    const nev = all.zaroNev || (K.ceg && (K.ceg.rovid || K.ceg.nev)) || '', web = all.zaroWeb || '';
    const t0 = performance.now();
    await new Promise(r => { const f = () => { const t = (performance.now() - t0) / 1000; g.fillStyle = szin; g.fillRect(0, 0, W, H);
      g.globalAlpha = Math.min(1, t / 0.4); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 92px Georgia, serif'; for (const [ix, x] of tordel(g, nev, W * 0.8).entries()) g.fillText(x, W / 2, H * 0.42 + ix * 104);
      g.font = '500 50px Figtree, system-ui, sans-serif'; g.fillText(web, W / 2, H * 0.56); g.globalAlpha = 1;
      if (t < 2.2) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    rec.stop(); await new Promise(r => { rec.onstop = r; }); try { ac && ac.close(); } catch (e) {}
    const tipus = mt.split(';')[0], blob = new Blob(ch, { type: tipus }), kit = tipus.includes('mp4') ? 'mp4' : 'webm';
    const ki = $('vagoKi'); ki.hidden = false; ki.textContent = '';
    const v = document.createElement('video'); v.src = URL.createObjectURL(blob); v.playsInline = true; v.className = 'vagoKesz'; ki.append(v);
    const pb = gomb('▶ Lejátszás', 'lejatszoB', () => { if (v.paused) v.play().catch(() => {}); else v.pause(); });
    v.addEventListener('play', () => { pb.textContent = '❚❚ Megállítás'; }); v.addEventListener('pause', () => { pb.textContent = '▶ Lejátszás'; }); v.addEventListener('click', () => pb.click());
    const fajl = new File([blob], `reel.${kit}`, { type: tipus });
    const a = el('a', 'btn sec full', 'Videó mentése'); a.href = v.src; a.download = fajl.name;
    ki.append(pb, gomb('Videó megosztása', 'btn full', async () => { try { await navigator.share({ files: [fajl] }); } catch (e) { a.click(); } }), a);
    st.textContent = `Kész: ${(blob.size / 1048576).toFixed(1)} MB, 1080×1920${kit === 'webm' ? ' (WebM – Facebookra feltölthető, iPhone-on mentés után nézd meg)' : ''}. Kitenni te teszed ki.`;
    $('vagoReel').disabled = false; window.__vago.utolso = blob;
  }

  window.__vago = { hozzaad, KLIPEK, all, legjobb, pont, celHossz, mutat: (be) => { hely().hidden = !be; } };
  hely();
})();
