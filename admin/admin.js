/* Akvarell kezelő – telefonra. Belépés: saját jelszó (munkamenet-süti) vagy Cloudflare Access; a szerver minden kérésnél ellenőrzi. */
(function () {
  "use strict";
  function api(ut, body) {
    return fetch("/admin/api/" + ut, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" } : { credentials: "same-origin" })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, data: d }; }); })
      .catch(function () { return { ok: false, status: 0, data: {} }; });
  }
  var fo = document.getElementById("fo"), ful = "ma";
  function e(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function mentve(el, ok, szoveg) { var s = document.createElement("span"); s.className = "mentve"; s.style.color = ok ? "" : "#b33"; s.textContent = szoveg || (ok ? "Mentve ✓" : "Nem sikerült"); el.appendChild(s); setTimeout(function () { s.remove(); }, 2500); }

  var ki = "";                                    // ki van bent: "gazda" | "uzemelteto" (linkes belépés), e-mail (Cloudflare Access) vagy "helyi"
  var SZEREP = { gazda: "Gazda", uzemelteto: "Üzemeltető" };
  function sajatFiok() { return ki === "gazda" || ki === "uzemelteto"; }
  function post(body) { return api("belepes", body); }
  async function indul() {
    // belépő link a címben: #kod=… (első belépés) vagy #be=… (új eszköz) – beváltjuk, és rögtön eltüntetjük a címből
    var kod = (location.hash.match(/kod=([a-z0-9-]+)/i) || [])[1], be = (location.hash.match(/be=([0-9a-f]{32})/) || [])[1];
    if (kod || be) {
      history.replaceState(null, "", location.pathname);
      var b = await post(kod ? { muvelet: "kod", kod: kod } : { muvelet: "link", token: be });
      if (!b.ok && b.status !== 409) return belepo(hibaSzoveg(b));
    }
    var r = await api("en");
    if (r.status === 401) return belepo(kod || be ? "Ezt a linket már felhasználták. Ha ezen a telefonon korábban beléptél, és mégsem enged be, kérj új linket." : "");
    if (!r.ok) { fo.innerHTML = '<div class="blokk"><p class="uzenet hiba">A kezelő most nem érhető el.</p></div>'; return; }
    ki = r.data.email || ""; ful = "ma"; vaz();
  }
  function belepo(uzenet) {
    fo.innerHTML = '<div class="blokk"><h2>Belépés</h2>' + (uzenet ? '<p class="uzenet hiba">' + e(uzenet) + "</p>" : "")
      + "<p>A kezelőbe linkkel lehet belépni, jelszó nincs. Koppints a Pétertől kapott linkre, és bent vagy; a telefonod 90 napig megjegyzi.</p>"
      + "<p>Másik telefonhoz: egy már belépett telefonon a <b>Beállítás → Belépés</b> alatt kérj új linket.</p></div>";
  }
  function hibaSzoveg(r) { return r.status === 0 ? "Nincs kapcsolat. Próbáld újra." : r.status === 429 ? "Túl sok próbálkozás. Várj negyed órát." : (r.data && r.data.hiba ? r.data.hiba.charAt(0).toUpperCase() + r.data.hiba.slice(1) + "." : "Nem sikerült."); }
  async function kilep() {
    if (ki.indexOf("@") > 0) { location.href = "/cdn-cgi/access/logout"; return; }
    if (!confirm("Kilépsz ezen a telefonon? Visszajönni csak új linkkel tudsz.")) return;
    await post({ muvelet: "kilep" }); belepo("Kiléptél.");
  }

  // Öt csoport; a csoporton belül alfülek. A „Ma” a nyitólap.
  var CSOP = [
    ["ma", "Ma", [["ma", "Ma"]]],
    ["fog", "Foglalások", [["keres", "Kérések"], ["naptar", "Naptár"], ["uzenet", "Utalványkérések"], ["penz", "Pénzügyek"]]],
    ["ven", "Vendégek", [["vendegek", "Kártya, hírlevél"], ["vk", "Vendégkönyv"], ["kihivas", "Kihívás-képek"]]],
    ["old", "Oldal", [["ar", "Árak, apartmanok"], ["tartalom", "Szövegek"], ["blog", "Zebegényi hét"]]],
    ["beal", "Beállítás", [["osszekotes", "Booking, Szállás.hu"], ["fiok", "Belépés, mentés"]]]
  ];
  ful = "ma";
  function csopja(f) { return CSOP.filter(function (c) { return c[2].some(function (x) { return x[0] === f; }); })[0]; }
  function megy(f) { ful = f; vaz(); window.scrollTo(0, 0); }
  function vaz() {
    var cs = csopja(ful);
    fo.innerHTML = '<nav class="ful fo-ful" aria-label="Fő részek">' + CSOP.map(function (c) { return '<button data-ful="' + c[2][0][0] + '"' + (c === cs ? ' class="most" aria-current="page"' : "") + ">" + c[1] + "</button>"; }).join("") + "</nav>"
      + (cs[2].length > 1 ? '<nav class="ful al-ful" aria-label="' + cs[1] + '">' + cs[2].map(function (f) { return '<button data-ful="' + f[0] + '"' + (f[0] === ful ? ' class="most" aria-current="page"' : "") + ">" + f[1] + "</button>"; }).join("") + "</nav>" : "")
      + '<div id="tart"><p class="jelmag">Betöltés…</p></div>';
    fo.querySelectorAll("[data-ful]").forEach(function (b) { b.onclick = function () { megy(b.dataset.ful); }; });
    ({ ma: maLap, keres: keresek, uzenet: uzenetek, naptar: naptar, osszekotes: osszekotes, blog: blog, vk: vendegkonyv, penz: penzugyek, vendegek: vendegek, ar: arak, tartalom: tartalom, kihivas: kihivas, fiok: fiok })[ful]();
  }
  var HONAP = ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."], NAPNEV = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
  function szepNap(n) { var d = new Date(n + "T12:00:00"), ma = iso(new Date()), h = iso(new Date(Date.now() + 864e5)); return n === ma ? "ma" : n === h ? "holnap" : HONAP[d.getMonth()] + " " + d.getDate() + "., " + NAPNEV[d.getDay()]; }
  function fo2(x) { return x.felnott + " felnőtt" + (x.gyerek ? ", " + x.gyerek + " gyerek" : ""); }

  /* Ma: mi vár rád, ki jön a héten, mi hiányzik még */
  async function maLap() {
    var r = await api("ma"), apk = await api("apartmanok");
    if (!r.ok) { t().innerHTML = '<p class="uzenet hiba">Nem sikerült betölteni.</p>'; return; }
    var d = r.data, nev = {}; (apk.data || []).forEach(function (a) { nev[a.id] = a.nev; });
    var teendo = [];
    if (d.uj.length) teendo.push(["keres", d.uj.length + " új foglaláskérés", d.uj.map(function (x) { return e(x.nev) + " · " + e(nev[x.apartman_id] || x.apartman_id) + " · " + szepNap(x.erkezes) + " → " + szepNap(x.tavozas); }).join("<br>")]);
    if (d.uzenet) teendo.push(["uzenet", d.uzenet + " új utalványkérés", ""]);
    if (d.ertekeles) teendo.push(["vendegek", d.ertekeles + " új értékelés vár arra, hogy kitedd", ""]);
    if (d.kep) teendo.push(["kihivas", d.kep + " beküldött kép vár jóváhagyásra", ""]);
    var h = '<div class="blokk"><h2>Rád vár</h2>' + (teendo.length ? teendo.map(function (x) { return '<button class="lepes" data-megy="' + x[0] + '"><b>' + x[1] + "</b>" + (x[2] ? '<span>' + x[2] + "</span>" : "") + "<i>→</i></button>"; }).join("") : '<p>Most nincs teendőd. Ha foglaláskérés érkezik, itt jelenik meg legfelül.</p>') + "</div>";
    function lista(L, mi) { return L.length ? L.map(function (x) { return '<div class="sor"><b>' + szepNap(x[mi]) + "</b> · " + e(nev[x.apartman_id] || x.apartman_id) + "<br>" + e(x.nev) + (x.felnott ? " · " + fo2(x) : "") + "</div>"; }).join("") : '<p class="jelmag">Senki.</p>'; }
    h += '<div class="blokk"><h2>A következő 7 nap</h2><h3>Érkezik</h3>' + lista(d.erkezik, "erkezes") + "<h3>Távozik</h3>" + lista(d.tavozik, "tavozas") + '<p class="jelmag">Csak az itt visszaigazolt foglalások. A Bookingon érkezőket a Booking mutatja.</p></div>';
    var H = d.hianyzik, hi = [];
    if (H.naptar) hi.push(["osszekotes", "Booking-naptár összekötése", H.naptar.van + " / " + H.naptar.kell + " apartman van összekötve. Amíg nincs, a Bookingon lefoglalt napot kézzel kell itt foglaltra tenni."]);
    if (H.level) hi.push(["", "Levélküldés", "A levelek (visszaigazolás, útbaigazítás, hírlevél) még nem mennek ki. Ezt Péter állítja be; a te feladócímed kell hozzá."]);
    if (H.vendegkonyv) hi.push(["vk", "Vendégkönyv adatai", "Telefonszám, wifi és bejutás. Ezt látja a vendég érkezés előtt."]);
    if (H.ajandek) hi.push(["tartalom", "A 10-es kihívás ajándéka", "Mit kap, aki végigjárta a tíz állomást? Amíg üres, az oldal nem ígér ajándékot."]);
    h += '<div class="blokk"><h2>Hiányzik még</h2>' + (hi.length ? hi.map(function (x) { return (x[0] ? '<button class="lepes" data-megy="' + x[0] + '">' : '<div class="lepes">') + "<b>" + x[1] + "</b><span>" + x[2] + "</span>" + (x[0] ? "<i>→</i></button>" : "</div>"); }).join("") : "<p>Minden be van állítva.</p>") + "</div>";
    if (d.blog) h += '<div class="blokk"><h2>Magától megy</h2><p>Legutóbbi heti bejegyzés: <b>' + e(d.blog.cim_hu) + '</b></p><div class="gombok"><button data-megy="blog">Zebegényi hét</button><a class="gomb masod" href="/#/blog" target="_blank" rel="noopener">Megnézem az oldalon</a></div></div>';
    t().innerHTML = h;
    t().querySelectorAll("[data-megy]").forEach(function (b) { b.onclick = function () { megy(b.dataset.megy); }; });
  }

  /* Belépés, mentés */
  async function fiok() {
    var sajat = sajatFiok(), a = (await api("belepes")).data || {}, F = a.fiokok || {};
    function sor(x) { return '<div class="sor"><b>' + SZEREP[x] + "</b>" + (x === ki ? " (te)" : "") + '<br><span class="jelmag">' + (F[x] ? "hozzáfér" : "még nincs belépve, vagy megszűnt a hozzáférése") + "</span></div>"; }
    t().innerHTML = '<div class="blokk"><h2>Belépés</h2>' + (sajat
      ? "<p>Belépve: <b>" + SZEREP[ki] + '</b>. Ezen a telefonon 90 napig nem kell újra belépned.</p><h3>Másik telefon vagy gép</h3><p class="jelmag">Kérj egy linket, és nyisd meg a másik eszközön. 15 percig él, és egyszer használható.</p><div class="gombok"><button class="gomb" id="ujl">Belépő link kérése</button></div><div id="lk"></div>'
      : "<p>Belépve: " + e(ki) + "</p>") + '<div class="gombok"><button id="ki">Kilépés ezen a telefonon</button>' + (sajat ? '<button id="kimind">Kilépés minden eszközömön</button>' : "") + "</div></div>"
      + '<div class="blokk"><h2>Ki fér hozzá?</h2><p class="jelmag">Két külön fiók van. Mindkettő ugyanazt látja és ugyanazt tudja.</p>' + sor("gazda") + sor("uzemelteto")
      + (ki === "gazda" && F.uzemelteto ? '<div class="gombok"><button id="uzki">Az üzemeltető hozzáférésének megszüntetése</button></div><p class="apro">Az adatok a tieid. Ha megszünteted, az üzemeltető azonnal kiesik minden eszközén, és csak új beüzemelő linkkel tud visszajönni.</p>' : "") + "</div>"
      + '<div class="blokk"><h2>Mentés</h2><p>Minden adat (foglalások, vendégek, szövegek, pénzügyek) egy fájlban. Érdemes havonta letölteni. A belépések nincsenek benne.</p><a class="gomb masod" href="/admin/api/mentes">Teljes mentés letöltése</a></div>';
    document.getElementById("ki").onclick = kilep;
    var uz = document.getElementById("uzki");
    if (uz) uz.onclick = async function () { if (!confirm("Megszünteted az üzemeltető hozzáférését? Azonnal kiesik minden eszközén.")) return; var r = await post({ muvelet: "uzemelteto_ki" }); if (r.ok) fiok(); else alert(hibaSzoveg(r)); };
    if (!sajat) return;
    document.getElementById("kimind").onclick = async function () { if (!confirm("Minden eszközödön kilépsz, ezen is. Visszajönni csak új linkkel tudsz. Folytatod?")) return; await post({ muvelet: "kilep_mind" }); belepo("Minden eszközödön kiléptél."); };
    document.getElementById("ujl").onclick = async function () {
      var r = await post({ muvelet: "uj_link" }), lk = document.getElementById("lk");
      if (!r.ok) { lk.innerHTML = '<p class="uzenet hiba">' + e(hibaSzoveg(r)) + "</p>"; return; }
      var url = location.origin + "/admin/#be=" + r.data.token, q = qrcode(0, "M"); q.addData(url); q.make();
      lk.innerHTML = '<div class="qr-link">' + q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) + '</div><p class="jelmag">Olvasd be a másik telefonnal, vagy küldd át neki. ' + r.data.perc + " percig él.</p>"
        + '<div class="gombok">' + (navigator.share ? '<button id="kuld">Átküldöm</button>' : "") + '<button id="masol">Link másolása</button></div>';
      var k = document.getElementById("kuld"); if (k) k.onclick = function () { navigator.share({ title: "Akvarell kezelő", url: url }).catch(function () {}); };
      document.getElementById("masol").onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { document.getElementById("masol").textContent = "Másolva"; }, function () { prompt("A link:", url); }); };
    };
  }
  var CIMKE = { uj: "új", visszaigazolva: "visszaigazolva", elutasitva: "elutasítva" };
  function t() { return document.getElementById("tart"); }


  /* Ajándékutalvány-kérések és egyéb üzenetek */
  async function uzenetek() {
    var r = await api("uzenetek");
    if (!r.ok) { t().innerHTML = '<p class="uzenet hiba">Nem sikerült betölteni.</p>'; return; }
    if (!r.data.length) { t().innerHTML = '<div class="blokk"><p>Még nincs utalványkérés.</p></div>'; return; }
    t().innerHTML = '<div class="blokk">' + r.data.map(function (x) {
      return '<div class="sor" data-id="' + x.id + '"><b>' + e(x.nev) + '</b> <span class="allapot ' + (x.allapot === "kesz" ? "visszaigazolva" : "uj") + '">' + (x.allapot === "kesz" ? "elintézve" : "új") + "</span><br>" + (x.tipus === "utalvany" ? "Ajándékutalvány" : "Üzenet") + " · " + e(x.letrehozva) +
        '<br><a href="mailto:' + e(x.email) + '">' + e(x.email) + "</a>" + (x.telefon ? ' · <a href="tel:' + e(x.telefon) + '">' + e(x.telefon) + "</a>" : "") + (x.szoveg ? '<br><span class="jelmag" style="white-space:pre-line">' + e(x.szoveg) + "</span>" : "") +
        '<div class="gombok"><button data-a="kesz">Elintézve</button><button data-a="uj">Újra nyitott</button></div></div>';
    }).join("") + "</div>";
    t().querySelectorAll(".sor").forEach(function (sor) {
      sor.querySelectorAll("[data-a]").forEach(function (b) {
        b.onclick = async function () {
          var ok = (await api("uzenet", { id: sor.dataset.id, allapot: b.dataset.a })).ok, c = sor.querySelector(".allapot");
          if (ok) { c.className = "allapot " + (b.dataset.a === "kesz" ? "visszaigazolva" : "uj"); c.textContent = b.dataset.a === "kesz" ? "elintézve" : "új"; }
          mentve(b.parentNode, ok);
        };
      });
    });
  }

  /* Naptár-összekötés: Booking / Szállás.hu / Airbnb / régi oldal iCal-címei be, a saját naptár címe ki */
  async function osszekotes() {
    var ap = await api("apartmanok"), n = await api("naptarak");
    if (!ap.ok || !n.ok) { t().innerHTML = '<p class="uzenet hiba">Nem sikerült betölteni.</p>'; return; }
    var alap = location.origin;
    t().innerHTML = '<div class="blokk"><p style="margin-top:0">Így látja az oldal a máshol (Booking, Szállás.hu, Airbnb, régi oldal) érkezett foglalásokat, és így látják azok az itteni foglalásokat. A szinkron félóránként magától fut.</p>' +
      (n.data.ido ? '<p class="jelmag">Utolsó szinkron: ' + new Date(n.data.ido).toLocaleString("hu-HU") + "</p>" : "") + '<button class="gomb" id="szinkron">Szinkron most</button><span id="sz-e"></span></div>' +
      ap.data.map(function (a) {
        var er = n.data.eredmeny[a.id];
        return '<div class="blokk" data-ap="' + a.id + '"><h3>' + e(a.nev) + '</h3><label class="mezo"><span>Külső naptár címe (iCal export, https://…)</span><input data-m="cim" value="' + e(n.data.cimek[a.id] || "") + '" placeholder="https://admin.booking.com/…/ical.html?…"></label>' +
          (er ? '<p class="jelmag">' + (er.ok ? "Rendben: " + er.napok + " foglalt nap" : "Hiba: " + e(er.hiba)) + "</p>" : "") +
          '<button class="gomb">Mentés</button><p class="jelmag" style="margin-top:12px">Ezt a címet add meg a Bookingnak / Szállás.hu-nak (naptár importálása):</p><code style="word-break:break-all">' + e(alap) + "/ical/" + a.id + ".ics</code></div>";
      }).join("");
    document.getElementById("szinkron").onclick = async function () {
      var r = await api("szinkron", {}), el = document.getElementById("sz-e"), db = Object.keys(r.data || {}).length;
      mentve(el, r.ok, r.ok ? (db ? "Kész: " + db + " naptár" : "Nincs beállított külső naptár") : null);
    };
    t().querySelectorAll("[data-ap]").forEach(function (b) {
      b.querySelector(".gomb").onclick = async function () { var r = await api("naptar", { ap: b.dataset.ap, cim: b.querySelector("[data-m=cim]").value.trim() }); mentve(this.parentNode, r.ok, r.ok ? null : (r.data.hiba || "Nem sikerült")); };
    });
  }

  /* Zebegényi hét: heti gépi bejegyzés (met.no, OVF, naplemente, szabad helyek) */
  var LEVEL = { visszaigazolas: "visszaigazolás", elotte: "érkezés előtt", tavozas: "távozás napján", ertekeles: "értékeléskérés" };
  function vkSor(x) {
    if (!x.token) return '<div class="vk-sor"></div>';
    var link = location.origin + "/#/vendeg/" + x.token, el = {}; try { el = JSON.parse(x.elkuldve || "{}"); } catch (z) {}
    var l = Object.keys(LEVEL).map(function (k) { return (el[k] ? "✓ " : "· ") + LEVEL[k]; }).join("  ");
    return '<div class="vk-sor jelmag">Vendégkönyv: <a href="' + e(link) + '" target="_blank" rel="noopener">megnyitás ↗</a><br>Levelek: ' + e(l) + "</div>";
  }

  /* Vendégkönyv: amit a vendég a saját linkjén lát. A wifi és a bejutás csak érkezés előtt 2 naptól látszik. */
  async function vendegkonyv() {
    var r = await api("vendegkonyv"), v = {};
    (r.data || []).forEach(function (x) { v[x.kulcs.slice(3)] = x.ertek; });
    var M = [["tel", "Telefonszám a vendégeknek", "i"], ["wifi_nev", "Wifi neve", "i"], ["wifi_jelszo", "Wifi jelszava", "i"], ["bejutas_hu", "Bejutás (kapu, kulcs) – magyarul", "a"], ["bejutas_en", "Bejutás – angolul", "a"], ["parkolas_hu", "Parkolás – magyarul", "a"], ["parkolas_en", "Parkolás – angolul", "a"], ["jakuzzi_hu", "Jakuzzi tudnivalók – magyarul", "a"], ["jakuzzi_en", "Jakuzzi tudnivalók – angolul", "a"], ["ertekeles_link", "Értékelés linkje (pl. Google-értékelés), https://…", "i"]];
    t().innerHTML = '<div class="blokk"><p class="jelmag">A visszaigazolt vendég a levélben kap egy saját linket. Ott ezeket látja. A wifi és a bejutás csak az érkezés előtti 2. naptól a távozás utáni napig jelenik meg.</p>' +
      M.map(function (m) { return '<label class="mezo"><span>' + m[1] + "</span>" + (m[2] === "a" ? '<textarea rows="3" data-m="' + m[0] + '">' + e(v[m[0]] || "") + "</textarea>" : '<input data-m="' + m[0] + '" value="' + e(v[m[0]] || "") + '">') + "</label>"; }).join("") +
      '<button class="gomb" id="vk-ment">Mentés</button></div><div class="blokk"><h2>Automatikus levelek</h2><p class="jelmag">Visszaigazoláskor azonnal; érkezés előtt 3 nappal; a távozás napján; másnap értékeléskérés. Neked minden érkezési napon reggel összefoglaló. Csak ha a levelező (Brevo) be van állítva; 8 és 20 óra között.</p><button class="gomb masod" id="vk-fut">Ellenőrzés most</button></div>';
    document.getElementById("vk-ment").onclick = async function () {
      var d = {}; t().querySelectorAll("[data-m]").forEach(function (x) { d[x.dataset.m] = x.value.trim(); });
      var k = await api("vendegkonyv", d); mentve(this.parentNode, k.ok, k.ok ? null : (k.data.hiba || "Nem sikerült"));
    };
    document.getElementById("vk-fut").onclick = async function () {
      var k = await api("vendegut", {}); mentve(this.parentNode, k.ok, k.ok ? (k.data.kihagyva ? "Kihagyva: " + k.data.kihagyva : "Lefutott: " + ((k.data.ki || []).length) + " levél") : "Nem sikerült");
    };
  }

  function ft(n) { return Math.round(n || 0).toLocaleString("hu-HU").replace(/[  ]/g, " ") + " Ft"; }

  /* Pénzügyek: a visszaigazolt közvetlen foglalások magától bekerülnek; a portálos foglalást és a kiadásokat itt rögzíted. */
  var KAT = { bevetel: { szallas: "Szállás", extra: "Extrák (reggeli, masszázs…)", egyeb: "Egyéb bevétel" }, kiadas: { takaritas: "Takarítás", etel: "Étel, reggeli alapanyag", extra: "Extrák költsége", jutalek: "Portáljutalék", rezsi: "Rezsi", karbantartas: "Karbantartás", marketing: "Hirdetés", egyeb: "Egyéb kiadás" } };
  var FORR = { kozvetlen: "Közvetlen (weboldal, telefon)", booking: "Booking.com", szallashu: "Szállás.hu", airbnb: "Airbnb", egyeb: "Egyéb" };
  var pz = { ev: String(new Date().getFullYear()), ho: String(new Date().getMonth() + 1).padStart(2, "0") };
  async function penzugyek() {
    var r = await api("penz?ev=" + pz.ev);
    if (!r.ok) { t().innerHTML = '<p class="uzenet hiba">Nem sikerült betölteni.</p>'; return; }
    var S = r.data.sorok, jp = +r.data.beall.portal_jutalek || 15, honap = S.filter(function (x) { return pz.ho === "ev" || x.datum.slice(5, 7) === pz.ho; });
    function osz(L, f) { return L.filter(f).reduce(function (a, x) { return a + x.osszeg; }, 0); }
    var bev = osz(honap, function (x) { return x.tipus === "bevetel"; }), kia = osz(honap, function (x) { return x.tipus === "kiadas"; }),
      kozv = osz(honap, function (x) { return x.tipus === "bevetel" && x.forras === "kozvetlen"; }), jut = osz(honap, function (x) { return x.kategoria === "jutalek"; }),
      fogl = honap.filter(function (x) { return x.tipus === "bevetel" && x.forras === "kozvetlen" && x.kategoria === "szallas"; }).length;
    var HO = ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."];
    var h = '<div class="blokk"><div class="gombok"><button data-ev="-1">‹ ' + (+pz.ev - 1) + "</button><b style=\"align-self:center\">" + pz.ev + '</b><button data-ev="1">' + (+pz.ev + 1) + ' ›</button></div><div class="honapok">' + HO.map(function (n, i) { var k = String(i + 1).padStart(2, "0"); return '<button data-ho="' + k + '"' + (pz.ho === k ? ' class="most"' : "") + ">" + n + "</button>"; }).join("") + '<button data-ho="ev"' + (pz.ho === "ev" ? ' class="most"' : "") + ">Egész év</button></div>";
    h += '<div class="merok"><div><small>Bevétel</small><b>' + ft(bev) + '</b></div><div><small>Kiadás</small><b>' + ft(kia) + '</b></div><div class="' + (bev - kia >= 0 ? "jo" : "rossz") + '"><small>Eredmény</small><b>' + ft(bev - kia) + '</b></div><div class="jo"><small>Megspórolt jutalék (' + jp + "%, " + fogl + ' közvetlen foglalás)</small><b>' + ft(kozv * jp / 100) + '</b></div><div><small>Kifizetett portáljutalék</small><b>' + ft(jut) + "</b></div></div>";
    function savok(tipus) {
      var o = {}; honap.filter(function (x) { return x.tipus === tipus; }).forEach(function (x) { o[x.kategoria] = (o[x.kategoria] || 0) + x.osszeg; });
      var k = Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }), max = Math.max.apply(null, k.map(function (x) { return o[x]; }).concat([1]));
      return k.length ? k.map(function (x) { return '<div class="sav-sor"><span>' + e(KAT[tipus][x] || x) + '</span><i style="width:' + Math.max(3, o[x] / max * 100) + '%" class="' + tipus + '"></i><b>' + ft(o[x]) + "</b></div>"; }).join("") : '<p class="jelmag">Nincs még ' + (tipus === "bevetel" ? "bevétel" : "kiadás") + ".</p>";
    }
    h += "<h3>Bevételek</h3>" + savok("bevetel") + "<h3>Kiadások</h3>" + savok("kiadas") + "</div>";
    var ma = new Date().toISOString().slice(0, 10);
    h += '<div class="blokk"><h2>Új tétel</h2><div class="gombok" id="pz-tip"><button data-tip="bevetel" class="most">Bevétel</button><button data-tip="kiadas">Kiadás</button></div><label class="mezo"><span>Kategória</span><select id="pz-kat"></select></label><label class="mezo"><span>Összeg (Ft)</span><input id="pz-osszeg" type="number" inputmode="numeric" step="100" min="0"></label><label class="mezo"><span>Dátum</span><input id="pz-datum" type="date" value="' + ma + '"></label><label class="mezo" id="pz-forras-m"><span>Honnan jött</span><select id="pz-forras">' + Object.keys(FORR).map(function (k) { return '<option value="' + k + '">' + FORR[k] + "</option>"; }).join("") + '</select></label><label class="mezo"><span>Megjegyzés</span><input id="pz-mj" placeholder="pl. Kárpáthy, 2 éj, Booking"></label><p class="jelmag" id="pz-sugo">Portálos bevételnél a jutalékot (' + jp + '%) a rendszer magától kiadásként rögzíti. A visszaigazolt közvetlen foglalások maguktól bekerülnek.</p><button class="gomb" id="pz-ment">Rögzítés</button></div>';
    h += '<div class="blokk"><h2>Tételek</h2>' + (honap.length ? honap.map(function (x) { return '<div class="sor penzsor"><span><b>' + (x.tipus === "bevetel" ? "+" : "−") + ft(x.osszeg) + "</b> " + e((KAT[x.tipus] || {})[x.kategoria] || x.kategoria) + '<br><span class="jelmag">' + x.datum + " · " + e(FORR[x.forras] || x.forras) + (x.auto ? " · automatikus" : "") + (x.megjegyzes ? " · " + e(x.megjegyzes) : "") + '</span></span><button data-torol="' + x.id + '" aria-label="Törlés">×</button></div>'; }).join("") : '<p class="jelmag">Ebben az időszakban nincs tétel.</p>') + "</div>";
    t().innerHTML = h;
    var mh = t().querySelector(".honapok .most"); if (mh) mh.parentNode.scrollLeft = mh.offsetLeft - 40;      // a kiválasztott hónap látsszon
    var tip = "bevetel";
    function katok() { $("#pz-kat").innerHTML = Object.keys(KAT[tip]).map(function (k) { return '<option value="' + k + '">' + KAT[tip][k] + "</option>"; }).join(""); }
    katok();
    t().querySelectorAll("[data-tip]").forEach(function (b) { b.onclick = function () { tip = b.dataset.tip; t().querySelectorAll("[data-tip]").forEach(function (y) { y.classList.toggle("most", y === b); }); katok(); }; });
    t().querySelectorAll("[data-ev]").forEach(function (b) { b.onclick = function () { pz.ev = String(+pz.ev + +b.dataset.ev); penzugyek(); }; });
    t().querySelectorAll("[data-ho]").forEach(function (b) { b.onclick = function () { pz.ho = b.dataset.ho; penzugyek(); }; });
    t().querySelectorAll("[data-torol]").forEach(function (b) { b.onclick = async function () { if (!confirm("Törlöd ezt a tételt?")) return; var k = await api("penz", { torol: +b.dataset.torol }); if (k.ok) penzugyek(); }; });
    $("#pz-ment").onclick = async function () {
      var d = { tipus: tip, kategoria: $("#pz-kat").value, osszeg: +$("#pz-osszeg").value, datum: $("#pz-datum").value, forras: $("#pz-forras").value, megjegyzes: $("#pz-mj").value };
      var k = await api("penz", d); if (k.ok) { pz.ev = d.datum.slice(0, 4); pz.ho = d.datum.slice(5, 7); penzugyek(); } else mentve(this.parentNode, false, k.data.hiba || "Nem sikerült");
    };
  }
  function $(q) { return document.querySelector(q); }

  /* Vendégek: vendégkártyák, hírlevél, beállítások, QR-kártya a szobába */
  async function vendegek() {
    var r = await api("vendegek");
    if (!r.ok) { t().innerHTML = '<p class="uzenet hiba">Nem sikerült betölteni.</p>'; return; }
    var V = r.data.vendegek, B = r.data.beall, hir = V.filter(function (x) { return x.hirlevel; }).length, vissza = V.filter(function (x) { return x.ottlet > 1; }).length;
    var qrUrl = location.origin + "/#/kartya/h/" + r.data.haz_kod;
    var h = '<div class="blokk"><div class="merok"><div><small>Vendégkártya</small><b>' + V.length + '</b></div><div><small>Hírlevélre feliratkozott</small><b>' + hir + '</b></div><div class="jo"><small>Visszatérő (2+ közvetlen ottlét)</small><b>' + vissza + "</b></div></div></div>";
    h += '<div class="blokk"><h2>QR-kártya a szobákba</h2><p class="jelmag">Nyomtasd ki, és tedd ki mind a négy apartmanba. Aki erről kér kártyát, annak a portálos ottléte is számít: legközelebb közvetlenül foglalva kedvezményt kap.</p><div id="qr-elo" class="qr-elo"></div><div class="gombok"><button class="gomb" id="qr-nyomtat">Nyomtatható kártya</button><button id="qr-uj">Új kód (ha a régi kikerült)</button></div></div>';
    var M = [["visszatero_kedvezmeny", "Visszatérő vendég kedvezménye (%)", "n"], ["kozvetlen_kedvezmeny", "Közvetlen foglalás ennyivel olcsóbb, mint a portálokon (%) – csak akkor írd be, ha a portálokon valóban ennyivel drágább az ár", "n"], ["portal_jutalek", "Portáljutalék (%) – a megspórolt jutalék számításához", "n"], ["takaritas_dij", "Takarítás díja foglalásonként (Ft) – visszaigazoláskor magától kiadás lesz", "n"], ["elonyok_hu", "Közvetlen foglalás előnyei, soronként (magyarul) – üresen az alapszöveg", "a"], ["elonyok_en", "Ugyanez angolul", "a"], ["ert_booking_pont", "Booking-pontszám (pl. 9,8)", "t"], ["ert_booking_db", "Booking-értékelések száma", "t"], ["ert_booking_url", "Az Akvarell Booking-oldalának címe", "t"], ["ert_szallas_pont", "Szállás.hu-pontszám", "t"], ["ert_szallas_db", "Szállás.hu-értékelések száma", "t"], ["ert_szallas_url", "Az Akvarell Szállás.hu-oldalának címe", "t"], ["ert_google_url", "Google-értékelés írásának linkje (a Google-cégprofilból)", "t"], ["google_place_id", "Google hely-azonosító (Place ID) – az élő Google-értékelésekhez, a kulcs mellé", "t"], ["ert_frissitve", "A pontszámok dátuma (ÉÉÉÉ-HH-NN)", "t"]];
    h += '<div class="blokk"><h2>Beállítások</h2>' + M.map(function (m) { return '<label class="mezo"><span>' + m[1] + "</span>" + (m[2] === "a" ? '<textarea rows="3" data-b="' + m[0] + '">' + e(B[m[0]]) + "</textarea>" : '<input data-b="' + m[0] + '"' + (m[2] === "n" ? ' type="number" inputmode="numeric"' : "") + ' value="' + e(B[m[0]]) + '">') + "</label>"; }).join("") + '<button class="gomb" id="b-ment">Mentés</button></div>';
    h += '<div class="blokk"><h2>Hírlevél</h2><p class="jelmag">Csak azok kapják, akik külön kérték. Minden levél alján leiratkozó link van. Előbb küldj próbát magadnak.</p><label class="mezo"><span>Tárgy</span><input id="h-targy" placeholder="Szabad még a szilveszter"></label><label class="mezo"><span>Szöveg magyarul</span><textarea id="h-hu" rows="5"></textarea></label><label class="mezo"><span>Szöveg angolul (üresen a magyar megy)</span><textarea id="h-en" rows="4"></textarea></label><div class="gombok"><button id="h-proba">Próba nekem</button><button class="gomb" id="h-kuld">Küldés ' + hir + ' címzettnek</button></div><p><a class="gomb masod" href="/admin/api/vendegek.csv">Feliratkozók letöltése (CSV)</a></p></div>';
    var ER = (await api("ertekelesek")).data || [];
    h += '<div class="blokk"><h2>Értékelések</h2><p class="jelmag">A vendégek a vendégkönyvükben írják, érkezés után. Csak az jelenik meg az oldalon, amit kiteszel. „Igazolt vendég” jelzéssel, az ottlét hónapjával.</p>' + (ER.length ? ER.map(function (x) { return '<div class="sor" data-ert="' + x.id + '"><b>' + x.pont + '/10</b> ' + e(x.nev) + ' <span class="allapot ' + (x.allapot === "kint" ? "visszaigazolva" : x.allapot === "rejtett" ? "elutasitva" : "uj") + '">' + ({ uj: "új", kint: "kint van", rejtett: "rejtve" })[x.allapot] + '</span><br><span class="jelmag">' + e(x.apartman_id || "") + " · " + e(x.ottlet || "") + "</span>" + (x.szoveg ? '<br>' + e(x.szoveg) : "") + '<div class="gombok"><button data-ea="kint">Kiteszem</button><button data-ea="rejtett">Elrejtem</button></div></div>'; }).join("") : '<p class="jelmag">Még nincs értékelés.</p>') + "</div>";
    h += '<div class="blokk"><h2>Vendégek</h2>' + (V.length ? V.map(function (x) { return '<div class="sor"><b>' + e(x.nev) + '</b> <span class="jelmag">' + e(x.email) + "</span><br>" + x.ottlet + " közvetlen ottlét" + (x.forras === "haz" ? " · a házban kérte" : "") + " · hírlevél: " + (x.hirlevel ? "igen (" + e((x.hirlevel_ido || "").slice(0, 10)) + ")" : x.leiratkozva ? "leiratkozott" : "nem") + "</div>"; }).join("") : '<p class="jelmag">Még nincs vendégkártya.</p>') + "</div>";
    t().innerHTML = h;
    function qr() { var q = qrcode(0, "M"); q.addData(qrUrl); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
    $("#qr-elo").innerHTML = qr();
    $("#qr-nyomtat").onclick = function () {
      var w = window.open("", "_blank"); if (!w) return;
      w.document.write('<!doctype html><meta charset="utf-8"><title>Akvarell vendégkártya QR</title><body style="font:16px Georgia,serif;margin:0"><div style="width:148mm;min-height:105mm;margin:10mm auto;border:1px solid #ccc;border-radius:8mm;padding:10mm;display:flex;gap:8mm;align-items:center;box-sizing:border-box"><div style="width:48mm;flex:none">' + qr() + '</div><div><div style="color:#2c6a89;font-weight:700">Akvarell Apartmanház · Zebegény</div><h1 style="font-size:22pt;margin:6px 0">Jöjj vissza hozzánk!</h1><p>Olvasd be a kódot, és kérj vendégkártyát. Legközelebb közvetlenül foglalva <b>' + (+B.visszatero_kedvezmeny || 10) + '% kedvezményt</b> kapsz a szállás árából.</p><p style="color:#5b6670;font-size:12pt">Scan the code for your guest card: ' + (+B.visszatero_kedvezmeny || 10) + '% off when you book directly next time.</p></div></div></body>');
      w.document.close(); setTimeout(function () { w.print(); }, 300);
    };
    $("#qr-uj").onclick = async function () { if (!confirm("Új QR-kód: a régi kártyák a szobákban nem működnek tovább. Folytatod?")) return; var k = await api("haz_kod", {}); if (k.ok) vendegek(); };
    t().querySelectorAll("[data-ert]").forEach(function (sor) { sor.querySelectorAll("[data-ea]").forEach(function (b) { b.onclick = async function () { var k = await api("ertekeles", { id: +sor.dataset.ert, allapot: b.dataset.ea }); if (k.ok) vendegek(); else mentve(b.parentNode, false); }; }); });
    $("#b-ment").onclick = async function () { var d = {}; t().querySelectorAll("[data-b]").forEach(function (x) { d[x.dataset.b] = x.value.trim(); }); var k = await api("beallitasok", d); mentve(this.parentNode, k.ok); };
    async function hk(proba, gomb) {
      var d = { targy: $("#h-targy").value, hu: $("#h-hu").value, en: $("#h-en").value, proba: proba };
      if (!proba && !confirm("Elküldöd " + hir + " címzettnek?")) return;
      // 30 címzettenként küld, amíg el nem fogy (a szerver megmondja, honnan folytassa)
      var k, kuldve = 0, ossz = 0; d.tol = 0; gomb.disabled = true;
      do { k = await api("hirlevel", d); if (!k.ok) break; kuldve += k.data.elkuldve; ossz += k.data.cimzett; d.tol = k.data.kov; if (d.tol) mentve(gomb.parentNode, true, "Küldés… " + kuldve); } while (d.tol);
      gomb.disabled = false;
      mentve(gomb.parentNode, k.ok, k.ok ? (k.data.kihagyva ? "Nincs beállítva a levelező (Brevo)" : "Elküldve: " + kuldve + " / " + ossz) : ((k.data && k.data.hiba) || "Nem sikerült") + (kuldve ? " – eddig elment: " + kuldve : ""));
    }
    $("#h-proba").onclick = function () { hk(true, this); };
    $("#h-kuld").onclick = function () { hk(false, this); };
  }

  async function blog() {
    var r = await api("blog");
    if (!r.ok) { t().innerHTML = '<p class="uzenet hiba">Nem sikerült betölteni.</p>'; return; }
    var NEV = { kint: "kint van", vazlat: "vázlat", levett: "levéve" };
    t().innerHTML = '<div class="blokk"><p style="margin-top:0">Minden héten magától elkészül a hétvégi bejegyzés hivatalos adatokból. Ha be van kapcsolva, azonnal kikerül; ha nincs, vázlat marad, amíg ki nem teszed.</p><label style="display:flex;gap:10px;align-items:center;min-height:44px"><input type="checkbox" id="b-auto"' + (r.data.auto ? " checked" : "") + '> Automatikus kitétel</label><button class="gomb" id="b-gen">A következő hétvége bejegyzése most</button><span id="b-e"></span></div>' +
      (r.data.bejegyzesek.length ? '<div class="blokk">' + r.data.bejegyzesek.map(function (x) {
        var ki = x.allapot === "kint";
        return '<div class="sor" data-id="' + x.id + '"><b>' + e(x.cim_hu) + '</b> <span class="allapot ' + (ki ? "visszaigazolva" : "uj") + '">' + NEV[x.allapot] + '</span><details><summary class="jelmag">Szöveg</summary>' + JSON.parse(x.test_hu).map(function (b) { return b[0] === "h" ? "<b>" + e(b[1]) + "</b><br>" : '<span class="jelmag">' + e(b[1]) + "</span><br>"; }).join("") + '</details><div class="gombok">' + (ki ? '<button data-a="levett">Leveszem</button>' : '<button data-a="kint">Kiteszem</button>') + "</div></div>";
      }).join("") + "</div>" : "");
    document.getElementById("b-auto").onchange = async function () { var r2 = await api("blog", { auto: this.checked }); mentve(this.parentNode, r2.ok); };
    document.getElementById("b-gen").onclick = async function () { var r2 = await api("blog/general", {}); mentve(document.getElementById("b-e"), r2.ok, r2.ok ? (r2.data.mar_van ? "Erre a hétvégére már van" : "Elkészült") : null); if (r2.ok && !r2.data.mar_van) setTimeout(blog, 800); };
    t().querySelectorAll(".sor").forEach(function (sor) {
      var b = sor.querySelector("[data-a]");
      b.onclick = async function () { var ok = (await api("blog", { id: sor.dataset.id, allapot: b.dataset.a })).ok; mentve(b.parentNode, ok); if (ok) setTimeout(blog, 600); };
    });
  }
  /* Ajánlatkérések */
  function probaGombok() {
    t().querySelectorAll("[data-proba]").forEach(function (b) {
      b.onclick = async function () {
        var v = await api("proba", b.dataset.proba === "torol" ? { torol: true } : {});
        if (!v.ok) { mentve(b.parentNode, false, v.data && v.data.hiba ? v.data.hiba : null); return; }
        keresek();
      };
    });
  }
  async function keresek() {
    var r = await api("ajanlatok");
    if (!r.ok) { t().innerHTML = '<p class="uzenet hiba">Nem sikerült betölteni.</p>'; return; }
    var PG = '<div class="gombok"><button data-proba="uj">Próbafoglalás</button>' + (r.data.some(function (y) { return y.proba; }) ? '<button data-proba="torol">Próbák törlése</button>' : "") + '</div><p class="jelmag">A próbafoglalás nem valódi: nem foglal napot, nem kerül a naptárba és a pénzügyekbe, a levél csak neked megy.</p>';
    if (!r.data.length) { t().innerHTML = '<div class="blokk">' + PG + '<p>Még nincs ajánlatkérés.</p></div>'; probaGombok(); return; }
    t().innerHTML = '<div class="blokk">' + PG + r.data.map(function (x) {
      var targy = encodeURIComponent((x.nyelv === "en" ? "Akvarell – your stay " : "Akvarell – foglalás ") + x.erkezes + " – " + x.tavozas);
      return '<div class="sor" data-id="' + x.id + '"><b>' + e(x.nev) + '</b> <span class="allapot ' + x.allapot + '">' + CIMKE[x.allapot] + "</span>" + (x.proba ? ' <span class="allapot uj">PRÓBA</span>' : "") + "<br>" + e(x.apartman_id) + " · " + x.erkezes + " → " + x.tavozas + " · " + x.felnott + " felnőtt" + (x.gyerek ? ", " + x.gyerek + " gyerek" : "") + " · " + x.nyelv.toUpperCase() + (x.ar_osszeg ? " · <b>" + ft(x.ar_osszeg) + "</b>" : "") + (x.visszatero ? ' <span class="allapot visszaigazolva">visszatérő −' + ft(x.ar_kedvezmeny || 0) + "</span>" : "") +
        '<br><a href="mailto:' + e(x.email) + "?subject=" + targy + '">' + e(x.email) + "</a>" + (x.telefon ? ' · <a href="tel:' + e(x.telefon) + '">' + e(x.telefon) + "</a>" : "") + (x.uzenet ? '<br><span class="jelmag">' + e(x.uzenet) + "</span>" : "") +
        vkSor(x) + '<div class="gombok"><button data-a="visszaigazolva">' + (x.proba ? "Visszaigazolva (próba: napot nem foglal)" : "Visszaigazolva + napok foglaltra") + '</button><button data-a="elutasitva">Elutasítva</button></div></div>';
    }).join("") + "</div>";
    probaGombok();
    t().querySelectorAll(".sor").forEach(function (sor) {
      var x = r.data.find(function (y) { return y.id == sor.dataset.id; });
      sor.querySelectorAll("[data-a]").forEach(function (b) {
        b.onclick = async function () {
          var v = await api("ajanlat", { id: x.id, allapot: b.dataset.a }), ok = v.ok;
          if (v.status === 409 && v.data.napok) {            // közben foglalt lett: csak kifejezett megerősítéssel
            var FN = { ical: "Booking/Szállás.hu naptár", kezi: "kézzel jelölve", ajanlat: "másik visszaigazolt foglalás" };
            if (!confirm("Figyelem, ezek a napok már foglaltak:\n" + v.data.napok.map(function (n) { return n.nap + " – " + (FN[n.forras] || n.forras); }).join("\n") + "\n\nBiztosan visszaigazolod? (Dupla foglalás lehet.)")) { mentve(b.parentNode, false, "Nem igazoltam vissza"); return; }
            v = await api("ajanlat", { id: x.id, allapot: b.dataset.a, megis: true }); ok = v.ok;
          }
          var cimke = sor.querySelector(".allapot"); if (ok) { cimke.className = "allapot " + b.dataset.a; cimke.textContent = CIMKE[b.dataset.a]; }
          if (ok && v.data.token) { x.token = v.data.token; var vs = sor.querySelector(".vk-sor"); if (vs) vs.outerHTML = vkSor(x); }
          mentve(b.parentNode, ok, ok && v.data.level ? "Mentve ✓ · levél: " + v.data.level : null);
        };
      });
    });
  }

  /* Foglalt napok: apartman + hónap, koppintásra ki/be */
  var nt = { ap: null, ho: new Date(new Date().getFullYear(), new Date().getMonth(), 1) };
  async function naptar() {
    var ap = await api("apartmanok");
    if (!nt.ap) nt.ap = ap.data[0].id;
    var tol = iso(nt.ho), ig = iso(new Date(nt.ho.getFullYear(), nt.ho.getMonth() + 1, 0));
    var f = await api("foglalt?ap=" + encodeURIComponent(nt.ap) + "&ho=" + tol.slice(0, 7)), fog = {};
    (f.data || []).forEach(function (x) { fog[x.nap] = true; });
    var hossz = new Date(nt.ho.getFullYear(), nt.ho.getMonth() + 1, 0).getDate(), kezd = (nt.ho.getDay() + 6) % 7;
    var h = '<div class="blokk"><label class="mezo"><span>Apartman</span><select id="n-ap">' + ap.data.map(function (a) { return '<option value="' + a.id + '"' + (a.id === nt.ap ? " selected" : "") + ">" + e(a.nev) + "</option>"; }).join("") + '</select></label><div class="naptar"><div class="fejl"><button data-l="-1">‹</button><b>' + nt.ho.getFullYear() + ". " + (nt.ho.getMonth() + 1) + '. hó</b><button data-l="1">›</button></div><div class="napok">';
    ["H", "K", "Sze", "Cs", "P", "Szo", "V"].forEach(function (x) { h += '<div class="h">' + x + "</div>"; });
    for (var i = 0; i < kezd; i++) h += "<div></div>";
    for (var d = 1; d <= hossz; d++) { var k = iso(new Date(nt.ho.getFullYear(), nt.ho.getMonth(), d)); h += '<button data-n="' + k + '" class="' + (fog[k] ? "foglalt" : "") + '">' + d + "</button>"; }
    t().innerHTML = h + '</div></div><p class="jelmag">Koppintás: foglalt ↔ szabad. Azonnal mentődik.</p><div id="n-e"></div></div>';
    document.getElementById("n-ap").onchange = function () { nt.ap = this.value; naptar(); };
    t().querySelectorAll("[data-l]").forEach(function (b) { b.onclick = function () { nt.ho = new Date(nt.ho.getFullYear(), nt.ho.getMonth() + (+b.dataset.l), 1); naptar(); }; });
    t().querySelectorAll("[data-n]").forEach(function (b) {
      b.onclick = async function () {
        var foglalt = b.classList.contains("foglalt");
        var r = await api("foglalt", { ap: nt.ap, nap: b.dataset.n, foglalt: !foglalt });
        if (r.ok) b.classList.toggle("foglalt");
        mentve(document.getElementById("n-e"), r.ok, r.ok ? b.dataset.n + (foglalt ? " szabad ✓" : " foglalt ✓") : null);
      };
    });
  }

  /* Árak és apartmanszövegek */
  var MEZOK = [["ar_hetkoznap", "1–2 fő, hétköznap (Ft/éj)", "n"], ["ar_hetvege", "1–2 fő, hétvége/főszezon", "n"], ["ar3_hetkoznap", "3 fő, hétköznap", "n"], ["ar3_hetvege", "3 fő, hétvége/főszezon", "n"], ["kiemeles_hu", "Kiemelés (magyar)", "t"], ["kiemeles_en", "Kiemelés (angol)", "t"], ["leiras_hu", "Leírás (magyar)", "a"], ["leiras_en", "Leírás (angol)", "a"]];
  async function arak() {
    var r = await api("apartmanok");
    t().innerHTML = r.data.map(function (a) {
      return '<details class="blokk" data-id="' + a.id + '"><summary><b>' + e(a.nev) + "</b><span class='arsor'>hétköznap " + ft(a.ar_hetkoznap) + " · hétvégén és főszezonban " + ft(a.ar_hetvege) + " <small>(1–2 fő, éjszakánként)</small></span></summary>" + MEZOK.map(function (m) {
        var v = e(a[m[0]]);
        return '<label class="mezo"><span>' + m[1] + "</span>" + (m[2] === "a" ? '<textarea rows="5" data-m="' + m[0] + '">' + v + "</textarea>" : '<input data-m="' + m[0] + '"' + (m[2] === "n" ? ' type="number" inputmode="numeric" step="1000"' : "") + ' value="' + v + '">') + "</label>";
      }).join("") + '<button class="gomb">Mentés</button></details>';
    }).join("");
    t().querySelectorAll("details").forEach(function (dt) {
      dt.querySelector(".gomb").onclick = async function () {
        var adat = {};
        dt.querySelectorAll("[data-m]").forEach(function (x) { adat[x.dataset.m] = x.type === "number" ? +x.value : x.value; });
        var u = await api("apartman", { id: dt.dataset.id, mezok: adat });
        mentve(this.parentNode, u.ok);
      };
    });
  }

  /* Főoldali szövegek */
  var SZOVEG = { cim: ["Főoldal: cím", "A nyitókép fölötti nagy felirat."], alcim: ["Főoldal: a cím alatti mondat", "A nyitóképen, a ház neve alatt."], bevezeto: ["Főoldal: bevezető", "Rövid bemutatkozás a főoldalon."],
    gyerek: ["Árak: gyerekár, felár, idegenforgalmi adó", "Az Árak oldalon és a foglalásnál a táblázat alatt."], kihivas_cim: ["10-es kihívás: cím", "A kihívás oldalának címe."], kihivas_bev: ["10-es kihívás: régi bevezető", "A térképes változat óta nem ez látszik; a következő mező az érvényes."],
    kihivas_bev2: ["10-es kihívás: bevezető", "A térkép fölötti szöveg."], ajandek: ["10-es kihívás: ajándék", "Mit kap, aki végigjárta a tíz állomást. Ha üres, az oldal nem ígér ajándékot."], uzemelteto: ["Lábléc: üzemeltető", "Minden oldal alján."] };
  async function tartalom() {
    var r = await api("tartalom");
    r.data.sort(function (a, b) { var k = Object.keys(SZOVEG); return (k.indexOf(a.kulcs) + 1 || 99) - (k.indexOf(b.kulcs) + 1 || 99); });
    t().innerHTML = r.data.map(function (x) {
      return '<div class="blokk" data-k="' + e(x.kulcs) + '"><h2>' + e((SZOVEG[x.kulcs] || [x.kulcs])[0]) + '</h2>' + (SZOVEG[x.kulcs] ? '<p class="jelmag">' + SZOVEG[x.kulcs][1] + "</p>" : "") + '<label class="mezo"><span>Magyar</span><textarea rows="3" data-ny="hu">' + e(x.hu) + '</textarea></label><label class="mezo"><span>Angol</span><textarea rows="3" data-ny="en">' + e(x.en) + '</textarea></label><button class="gomb">Mentés</button></div>';
    }).join("");
    t().querySelectorAll("[data-k]").forEach(function (b) {
      b.querySelector(".gomb").onclick = async function () {
        var u = await api("tartalom", { kulcs: b.dataset.k, hu: b.querySelector("[data-ny=hu]").value, en: b.querySelector("[data-ny=en]").value });
        mentve(this.parentNode, u.ok);
      };
    });
  }

  /* Kihívás-képek jóváhagyása */
  async function kihivas() {
    var r = await api("kihivas");
    if (!r.data.length) { t().innerHTML = '<div class="blokk"><p>Még nincs beküldött kép.</p></div>'; return; }
    t().innerHTML = '<div class="blokk">' + r.data.map(function (x) {
      return '<div class="sor" data-id="' + x.id + '"><img class="adminkep" loading="lazy" src="/admin/api/kep/' + encodeURIComponent(x.id) + '" alt=""><b>' + e(x.becenev) + "</b> · " + x.allomas + '. állomás <span class="allapot ' + (x.jovahagyva ? "visszaigazolva" : "uj") + '">' + (x.jovahagyva ? "kint van" : "vár") + '</span><div class="gombok">' + (x.jovahagyva ? '<button data-a="le">Levesz</button>' : '<button data-a="fel">Jóváhagyom</button>') + '<button data-a="torol">Törlöm</button></div></div>';
    }).join("") + "</div>";
    t().querySelectorAll(".sor").forEach(function (sor) {
      var x = r.data.find(function (y) { return y.id == sor.dataset.id; });
      sor.querySelectorAll("[data-a]").forEach(function (b) {
        b.onclick = async function () {
          var hiba;
          if (b.dataset.a === "torol") {
            if (!confirm("Végleg törlöd ezt a képet?")) return;
            hiba = !(await api("kihivas", { id: x.id, torol: true })).ok;
            if (!hiba) { sor.remove(); return; }
          } else hiba = !(await api("kihivas", { id: x.id, jovahagyva: b.dataset.a === "fel" })).ok;
          if (!hiba) { x.jovahagyva = b.dataset.a === "fel"; var c = sor.querySelector(".allapot"); c.className = "allapot " + (x.jovahagyva ? "visszaigazolva" : "uj"); c.textContent = x.jovahagyva ? "kint van" : "vár"; b.dataset.a = x.jovahagyva ? "le" : "fel"; b.textContent = x.jovahagyva ? "Levesz" : "Jóváhagyom"; }
          mentve(b.parentNode, !hiba);
        };
      });
    });
  }

  indul();
})();
