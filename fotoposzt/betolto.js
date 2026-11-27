// Tudáscsomag-betöltő: ?csomag=<név> esetén a csomagok/<név>.json lesz a keszlet,
// különben a lapba ágyazott (Akvarell) keszlet marad. Utána indul a motor (app.js).
(() => {
  const nev = new URLSearchParams(location.search).get('csomag');
  const indit = () => { const s = document.createElement('script'); s.src = 'app.js'; document.body.append(s); };
  const hiba = (szoveg) => {
    const p = document.createElement('p');
    p.className = 'note'; p.setAttribute('role', 'alert');
    p.textContent = szoveg;
    document.querySelector('.wrap').prepend(p);
  };
  if (!nev) return indit();
  if (!/^[a-z0-9-]{1,40}$/.test(nev)) { hiba('Érvénytelen csomagnév, az alapcsomag töltődött be.'); return indit(); }
  fetch('csomagok/' + nev + '.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.text() : Promise.reject(new Error(r.status)))
    .then(t => {
      const k = JSON.parse(t);
      if (!k.ceg || !k.ceg.hely || !Array.isArray(k.temak)) throw new Error('hiányos csomag');
      document.getElementById('keszlet').textContent = t;
    })
    .catch(e => hiba('A(z) „' + nev + '” csomag nem tölthető be (' + e.message + '), az alapcsomag töltődött be.'))
    .finally(indit);
})();
