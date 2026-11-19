/* Akvarell kezelő – telefonra. Belépés: Cloudflare Access (e-mailes kód) az /admin útvonalon; a szerver minden kérésnél ellenőrzi. */
(function () {
  "use strict";
  function api(ut, body) {
    return fetch("/admin/api/" + ut, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" } : { credentials: "same-origin" })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, data: d }; }); })
      .catch(function () { return { ok: false, status: 0, data: {} }; });
  }
  var fo = document.getElementById("fo"), ful = "keres";
  function e(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function mentve(el, ok, szoveg) { var s = document.createElement("span"); s.className = "mentve"; s.style.color = ok ? "" : "#b33"; s.textContent = szoveg || (ok ? "Mentve ✓" : "Nem sikerült"); el.appendChild(s); setTimeout(function () { s.remove(); }, 2500); }

  async function indul() {
    var r = await api("en");
    if (r.status === 401) { fo.innerHTML = '<div class="blokk"><p>Ehhez a kezelőhöz belépés kell. Töltsd újra az oldalt; a Cloudflare e-mailben küld egy kódot.</p></div>'; return; }
    if (!r.ok) { fo.innerHTML = '<div class="blokk"><p class="uzenet hiba">A kezelő most nem érhető el.</p></div>'; return; }
    vaz();
  }
  function kilep() { location.href = "/cdn-cgi/access/logout"; }

  var FULEK = [["keres", "Foglalások"], ["uzenet", "Üzenetek"], ["naptar", "Foglalt napok"], ["osszekotes", "Booking / Szállás.hu"], ["blog", "Zebegényi hét"], ["vk", "Vendégkönyv"], ["ar", "Árak, szövegek"], ["tartalom", "Főoldal"], ["kihivas", "Kihívás-képek"]];
  function vaz() {
    fo.innerHTML = '<nav class="ful">' + FULEK.map(function (f) { return '<button data-ful="' + f[0] + '"' + (f[0] === ful ? ' class="most"' : "") + ">" + f[1] + "</button>"; }).join("") + '</nav><div id="tart"></div><p><a class="gomb masod" href="/admin/api/mentes">Teljes mentés letöltése</a> <button class="gomb masod" id="ki">Kilépés</button></p>';
    fo.querySelectorAll("[data-ful]").forEach(function (b) { b.onclick = function () { ful = b.dataset.ful; vaz(); }; });
    document.getElementById("ki").onclick = kilep;
    ({ keres: keresek, uzenet: uzenetek, naptar: naptar, osszekotes: osszekotes, blog: blog, vk: vendegkonyv, ar: arak, tartalom: tartalom, kihivas: kihivas })[ful]();
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
  async function keresek() {
    var r = await api("ajanlatok");
    if (!r.ok) { t().innerHTML = '<p class="uzenet hiba">Nem sikerült betölteni.</p>'; return; }
    if (!r.data.length) { t().innerHTML = '<div class="blokk"><p>Még nincs ajánlatkérés.</p></div>'; return; }
    t().innerHTML = '<div class="blokk">' + r.data.map(function (x) {
      var targy = encodeURIComponent((x.nyelv === "en" ? "Akvarell – your stay " : "Akvarell – foglalás ") + x.erkezes + " – " + x.tavozas);
      return '<div class="sor" data-id="' + x.id + '"><b>' + e(x.nev) + '</b> <span class="allapot ' + x.allapot + '">' + CIMKE[x.allapot] + "</span><br>" + e(x.apartman_id) + " · " + x.erkezes + " → " + x.tavozas + " · " + x.felnott + " felnőtt" + (x.gyerek ? ", " + x.gyerek + " gyerek" : "") + " · " + x.nyelv.toUpperCase() +
        '<br><a href="mailto:' + e(x.email) + "?subject=" + targy + '">' + e(x.email) + "</a>" + (x.telefon ? ' · <a href="tel:' + e(x.telefon) + '">' + e(x.telefon) + "</a>" : "") + (x.uzenet ? '<br><span class="jelmag">' + e(x.uzenet) + "</span>" : "") +
        vkSor(x) + '<div class="gombok"><button data-a="visszaigazolva">Visszaigazolva + napok foglaltra</button><button data-a="elutasitva">Elutasítva</button></div></div>';
    }).join("") + "</div>";
    t().querySelectorAll(".sor").forEach(function (sor) {
      var x = r.data.find(function (y) { return y.id == sor.dataset.id; });
      sor.querySelectorAll("[data-a]").forEach(function (b) {
        b.onclick = async function () {
          var v = await api("ajanlat", { id: x.id, allapot: b.dataset.a }), ok = v.ok;
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
      return '<details class="blokk" data-id="' + a.id + '"><summary><b>' + e(a.nev) + "</b> · " + a.ar_hetkoznap + " / " + a.ar_hetvege + " Ft</summary>" + MEZOK.map(function (m) {
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
  async function tartalom() {
    var r = await api("tartalom");
    t().innerHTML = r.data.map(function (x) {
      return '<div class="blokk" data-k="' + e(x.kulcs) + '"><h2>' + e(x.kulcs) + '</h2><label class="mezo"><span>Magyar</span><textarea rows="3" data-ny="hu">' + e(x.hu) + '</textarea></label><label class="mezo"><span>Angol</span><textarea rows="3" data-ny="en">' + e(x.en) + '</textarea></label><button class="gomb">Mentés</button></div>';
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
