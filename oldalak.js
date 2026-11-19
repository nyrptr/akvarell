/* Ernő régi oldalának szolgáltatásai, árai, élményei – az ő szövegéből (akvarellzebegeny.hu, letöltve 2026-11-19), magyarul
   szó szerint vagy rövidítve, angolul saját fordítás. Ahol a régi oldal önmagának ellentmond, az ELTERES lista sorolja fel
   (Ernőtől kell megkérdezni, melyik érvényes); addig az Árak oldal értéke áll itt. */
window.OLDALAK = {
  kapcsolat: { tel: "+36 70 326 0101", telLink: "tel:+36703260101", email: "info@akvarellzebegeny.hu", cim: "2627 Zebegény, Csalogány utca 4.",
    facebook: "https://www.facebook.com/akvarellapartmanhaz", instagram: "https://www.instagram.com/akvarellzebegeny/", virtualis: "https://akvarellzebegeny.hu/virtualisseta/" },

  ertekeles: { pont: "9,8", forras: "Booking.com", velemenyek: [
    { nev: "Krisztina", hu: "Az eddigi legjobb ahol voltam. Csodás kilátás az apartman minden helyiségéből, makulátlan tisztaság.", en: "The best place I have ever stayed. Wonderful views from every room, spotless." },
    { nev: "Márton", hu: "Gyönyörű panoráma, a nap minden órájában hihetetlen élvezetes. A szállás pedig egy ékszerdoboz.", en: "A beautiful panorama, a delight at every hour of the day. The place itself is a jewel box." },
    { nev: "Gábor", hu: "A gyönyörű panorámát igazán ki lehet élvezni a hatalmas ablakok által. Téli pihenésünkre ideális helyszín volt.", en: "The huge windows let you really enjoy the view. It was ideal for our winter break." },
    { nev: "Helga", hu: "Endless view! It is just as perfect as it seems on the photos.", en: "Endless view! It is just as perfect as it seems on the photos." }
  ] },

  felszereltseg: [
    { ikon: "jakuzzi", kep: "Jakuzzi.jpg", cim: { hu: "Jakuzzi dunai panorámával", en: "Hot tub with a Danube view" },
      hu: ["Szállóvendégeink díjmentesen használhatják az udvaron található közös használatú, fűthető kültéri jakuzzit, melyről páratlan kilátás nyílik a Dunakanyarra.", "Érkezés után a lépcsőház földszinti falán lévő jakuzzi-tervezőbe írhatod be, mikor szeretnéd használni."],
      en: ["Guests can use the shared, heated outdoor hot tub in the courtyard free of charge, with an unrivalled view of the Danube Bend.", "After arrival, book your time slot on the hot tub planner on the ground-floor wall of the staircase."] },
    { ikon: "hal", kep: "Szonyi-apartman-nappali-halo.jpg", cim: { hu: "Panorámás hálószoba", en: "Bedroom with a view" },
      hu: ["A felső szinten (Szőnyi és Berény) hatalmas üvegfalon át tárul elénk a dunai panoráma, így az ágyból fekve csodálhatjuk a naplementét.", "Az alsó szinten (Amrita, Kárpáthy) a hálószobából is erkélyajtó nyílik a hatalmas teraszra.", "Kényelmes, nagy méretű franciaágy minden apartmanban."],
      en: ["Upstairs (Szőnyi and Berény) a huge glass wall opens onto the Danube, so you can watch the sunset from bed.", "Downstairs (Amrita, Kárpáthy) a door leads from the bedroom straight onto the large terrace.", "A large, comfortable double bed in every apartment."] },
    { ikon: "furdo", kep: "Szonyi-apartman-furdo-kilatas.jpg", cim: { hu: "Panorámás fürdőszoba", en: "Bathroom with a view" },
      hu: ["Kevés helyen biztosított ez az élmény diszkrét keretek között, a 2 felső apartmanban ez is lehetséges.", "Épített zuhanyzó, hajszárító, kozmetikai tükör, pipere-bekészítés."],
      en: ["Rare anywhere, and discreet here: in the two upstairs apartments the view follows you into the bathroom.", "Walk-in shower, hairdryer, vanity mirror, toiletries."] },
    { ikon: "konyha", kep: "Amrita-apartman-konyha.jpg", cim: { hu: "Panorámás amerikai konyha", en: "Open kitchen with a view" },
      hu: ["Teljesen felszerelt konyha: mikrohullámú sütő, kávéfőző, kenyérpirító, vízforraló, hűtő, edények, serpenyők, tányér- és evőeszközkészlet, víz- és borospohár.", "GRATIS minibár-bekészítés minden vendégnek."],
      en: ["Fully equipped kitchen: microwave, coffee maker, toaster, kettle, fridge, pots, pans, plates, cutlery, water and wine glasses.", "A complimentary minibar for every guest."] },
    { ikon: "nappali", kep: "Karpathy-apartman-nappali.jpg", cim: { hu: "Panorámás nappali", en: "Living room with a view" },
      hu: ["Ágyazható kanapé, LED televízió flexibilis konzolon, étkezőasztal."],
      en: ["Sofa bed, LED TV on a flexible mount, dining table."] },
    { ikon: "klima", cim: { hu: "Klímatizált apartmanok", en: "Air-conditioned apartments" },
      hu: ["Minden apartmanhoz külön split klíma tartozik saját távirányítóval, a helyiségek elektromos fűtőpanellel is felszereltek."],
      en: ["Each apartment has its own split air conditioner with remote control, plus electric heating panels."] },
    { ikon: "ingyen", cim: { hu: "Ingyenes extrák", en: "Free extras" },
      hu: ["Vasaló, vasalódeszka, ruhaszárító, törölközőszárító, hajszárító.", "Kávé, tea, só, cukor.", "Ingyenes wifi, parkoló és elektromosautó-töltő."],
      en: ["Iron, ironing board, clothes horse, towel rail, hairdryer.", "Coffee, tea, salt, sugar.", "Free Wi-Fi, parking and EV charging."] },
    { ikon: "baba", cim: { hu: "Bababarát szolgáltatások", en: "Baby-friendly" },
      hu: ["Kérhető: kiságy, fellépő, bili, WC-szűkítő, etetőszék, babakád."],
      en: ["On request: cot, step stool, potty, toilet seat reducer, high chair, baby bath."] },
    { ikon: "villam", cim: { hu: "Megújuló energia, díjmentes töltés", en: "Renewable energy, free charging" },
      hu: ["Az apartmanház energiaellátását napelemrendszer biztosítja.", "Elektromos autóval érkező vendégeinknek díjmentes töltési lehetőséget biztosítunk (előzetes egyeztetéssel)."],
      en: ["The house runs on its own solar panels.", "Free EV charging for guests (please let us know in advance)."] },
    { ikon: "auto", cim: { hu: "Saját parkoló", en: "Private parking" },
      hu: ["Minden apartmanhoz tartozik egy díjmentes parkolóhely, kis tábla jelzi."],
      en: ["Every apartment has its own free parking space, marked with a small sign."] }
  ],

  arak: {
    sorok: [
      { hu: "1–2 felnőtt / éjszaka", en: "1–2 adults / night", kulcs: "12" },
      { hu: "3 felnőtt / éjszaka", en: "3 adults / night", kulcs: "3" },
      { hu: "3–13 éves gyermek / éjszaka", en: "Child aged 3–13 / night", fix: 15000 },
      { hu: "3 év alatt", en: "Under 3", szoveg: { hu: "ingyenes", en: "free" } },
      { hu: "Egyéjszakás felár", en: "One-night surcharge", fix: 20000 }
    ],
    kiemelt: { hu: "Kiemelt időszak: június 1. – augusztus 31., valamint húsvét, pünkösd és a karácsony–szilveszter közötti időszak.", en: "Peak periods: 1 June – 31 August, plus Easter, Whitsun and Christmas to New Year." },
    ifa: { hu: "Az árak nem tartalmazzák az idegenforgalmi adót (750 Ft/fő/éj, 18 év felett). Az IFA érkezés előtt utalással vagy helyszínen készpénzzel fizetendő, SZÉP-kártyával nem fizethető.", en: "Prices do not include the tourist tax (HUF 750 per person per night, over 18). It is paid by transfer before arrival or in cash on site, not by SZÉP card." },
    hosszu: { hu: "Hosszú hétvégék 2026: legalább 3 éjszaka – május 1–3., május 23–25., október 23–25.; legalább 4 éjszaka – április 3–6. (húsvét), augusztus 20–23., december 24–27.", en: "Long weekends in 2026: minimum 3 nights – 1–3 May, 23–25 May, 23–25 October; minimum 4 nights – 3–6 April (Easter), 20–23 August, 24–27 December." },
    kedvezmeny: { hu: "Legalább 7 egymást követő éjszaka esetén 5% kedvezmény.", en: "5% off for stays of 7 nights or more." },
    fizetes: { hu: "A visszaigazolást követő 2 órán belül a szállásdíj teljes összegét kell kifizetni: átutalással, online bankkártyával (OTP SimplePay) vagy MKB, OTP, K&H SZÉP-kártyával. A foglalás a kifizetés után végleges.", en: "The full amount is due within 2 hours of confirmation: by bank transfer, card online (OTP SimplePay) or MKB, OTP or K&H SZÉP card. The booking is final once paid." },
    lemondas: { hu: "Díjmentes lemondás írásban az érkezés előtti 14. napig. Az érkezés előtti 13–4. napig a szállásdíj 50%-át visszafizetjük. Az érkezés előtti 3. naptól nincs visszafizetés. Az érkezést megelőző 3. napig egyszer díjmentesen módosítható.", en: "Free cancellation in writing up to 14 days before arrival. From 13 to 4 days before arrival, 50% is refunded. No refund from 3 days before arrival. You can change your dates once, free of charge, up to 3 days before arrival." }
  },

  extrak: [
    { id: "reggeli", ar: 7000, egyseg: "fo_alkalom", min: 2, cim: { hu: "Helyi termelői reggeli", en: "Local producers' breakfast" },
      leiras: { hu: "Reggel 8-ig az ajtód elé szállítva: termelői felvágottak és sajtok, zöldség, házi joghurt és vaj, vadkovászos pékáru, frissen préselt gyümölcslé. Minimum 2 főre, 48 órával érkezés előtt kérhető.", en: "Delivered to your door by 8 am: cured meats and cheeses from local producers, vegetables, homemade yoghurt and butter, sourdough pastries, freshly pressed juice. Minimum 2 people, order 48 hours before arrival." } },
    { id: "ebike", ar: 10000, egyseg: "fo_nap", cim: { hu: "E-bike bérlés", en: "E-bike rental" },
      leiras: { hu: "Giant elektromos kerékpárok sisakkal és lakattal, kaució nélkül, bérleti szerződéssel. Budapesttől Szobig 70 km kiépített kerékpárút.", en: "Giant e-bikes with helmet and lock, no deposit, with a rental agreement. 70 km of cycle path from Budapest to Szob." } },
    { id: "szulinap", ar: 25000, egyseg: "db", cim: { hu: "Születésnapi meglepetés", en: "Birthday surprise" },
      leiras: { hu: "Lufidekoráció, virágcsokor, Törley pezsgő (édes vagy száraz), bonbon.", en: "Balloon decoration, bouquet, Törley sparkling wine (sweet or dry), chocolates." } },
    { id: "naszut", ar: 25000, egyseg: "db", cim: { hu: "Nászutas csomag", en: "Honeymoon package" },
      leiras: { hu: "Romantikus dekoráció, virágcsokor, Excellent Törley pezsgő, bonbon.", en: "Romantic decoration, bouquet, Excellent Törley sparkling wine, chocolates." } },
    { id: "masszazs", ar: null, cim: { hu: "Masszázs (svéd- vagy gyógymasszázs)", en: "Massage (Swedish or therapeutic)" },
      leiras: { hu: "45, 60 vagy 90 perc. 3–4 héttel érkezés előtt kérd; az ár a masszőrtől függ.", en: "45, 60 or 90 minutes. Please request 3–4 weeks before arrival; price depends on the therapist." } },
    { id: "toltes", ar: 0, cim: { hu: "Elektromosautó-töltés", en: "EV charging" }, leiras: { hu: "Díjmentes.", en: "Free of charge." } },
    { id: "korai", ar: 5500, egyseg: "ora", cim: { hu: "Korai érkezés / késői távozás", en: "Early arrival / late departure" },
      leiras: { hu: "Szabad kapacitás függvényében 15 óra előtt, illetve 10 óra után.", en: "Before 3 pm or after 10 am, subject to availability." } }
  ],

  elmenyek: [
    { id: "kihivas", kep: "Jakuzzi-2.jpg", link: "#/kihivas", cim: { hu: "Zebegény 10-es kihívás", en: "Zebegény 10 Challenge" }, rovid: { hu: "Tíz állomás, tíz szelfi a faluban.", en: "Ten stops, ten selfies around the village." } },
    { id: "masszazs", kep: "https://akvarellzebegeny.hu/wp-content/uploads/2023/02/Akvarell-Zebegeny-webnagy-90-scaled.jpg", cim: { hu: "Egyéni és páros masszázs", en: "Massage for one or two" },
      rovid: { hu: "Svéd- és gyógymasszázs 45, 60 vagy 90 percben, a házban.", en: "Swedish or therapeutic massage, 45, 60 or 90 minutes, in the house." },
      hu: ["Az Akvarell vendégeiként 45, 60 vagy 90 perces relaxáló masszázst is kérhetsz. A stresszoldó és frissítő svédmasszázson kívül gyógymasszázs is van (mozgásszervi problémák esetén).", "A masszázst 3–4 héttel érkezés előtt érdemes kérni, hogy biztosan sorra kerülj. Foglaláskor a megjegyzésben írd meg, milyen masszázst szeretnél."],
      en: ["As a guest you can book a relaxing 45, 60 or 90-minute massage: refreshing Swedish massage or therapeutic massage for muscle and joint problems.", "Please request it 3–4 weeks before arrival. When booking, tell us in the message which kind you would like."] },
    { id: "ebike", kep: null, cim: { hu: "E-bike a Dunakanyarban", en: "E-bikes in the Danube Bend" },
      rovid: { hu: "Elektromos kerékpárral az emelkedők sem gond.", en: "With an e-bike, the hills are no problem." },
      hu: ["Tekerd körbe a Dunakanyart Giant elektromos kerékpárokkal: könnyedén feljutsz a magasabban fekvő pontokra is, ahonnan a Dunakanyar panorámája tárul eléd.", "Budapesttől Szobig 70 km kiépített kerékpárút. Bérlés: 10 000 Ft/fő/nap, sisakkal és lakattal, kaució nélkül, bérleti szerződéssel. Foglaláskor extraként kérheted."],
      en: ["Explore the Danube Bend on Giant e-bikes: even the high viewpoints are within easy reach.", "70 km of cycle path from Budapest to Szob. Rental: HUF 10,000 per person per day, helmet and lock included, no deposit, with a rental agreement. Add it as an extra when booking."] },
    { id: "kajak", kep: null, cim: { hu: "Kajak-kenu a Dunán", en: "Kayak and canoe on the Danube" },
      rovid: { hu: "A Dunakanyar legszebb arca a vízről.", en: "The Danube Bend at its most beautiful, from the water." },
      hu: ["A Dunáról nézve még varázslatosabb a hegyek ölelése. Nincs dugó, nincs zaj, csak a víz ringatása. A Duna ezen szakasza nyugodt, kezdőknek is ajánlott.", "Vízre szállás: Zebegény (Kerékbár), Szob, Ipolydamásd, Letkés, Ipolytölgyes, Garamkövesd, Kicsind, Esztergom – lefelé a cél Zebegény.", "Bérlés és árak: 06 30 931 0848."],
      en: ["From the river the hills look even more magical. No traffic, no noise, just the water. This stretch of the Danube is calm and suitable for beginners.", "Put-in points: Zebegény (Kerékbár), Szob, Ipolydamásd, Letkés, Ipolytölgyes, Garamkövesd, Kicsind, Esztergom – paddling downstream, you finish in Zebegény.", "Rental and prices: +36 30 931 0848."] },
    { id: "komp", kep: null, cim: { hu: "Komppal Visegrádra", en: "By ferry to Visegrád" },
      rovid: { hu: "Egész évben, óránként – a túlparton a Fellegvár.", en: "All year, every hour – the citadel waits on the far bank." },
      hu: ["A Nagymaros–Visegrád komp egész évben, minden órában közlekedik, autóval is átkelhetsz. A túlparton a legendás Fellegvár fenséges kilátást kínál a Dunakanyarra.", "Egy könnyű séta, egy kis időutazás, majd kávé vagy ebéd Visegrádon – fél- vagy egész napos program. Este pedig a fűthető jakuzziból nézheted a naplementét."],
      en: ["The Nagymaros–Visegrád ferry runs every hour all year round, cars included. On the far bank, the legendary citadel looks out over the Danube Bend.", "An easy walk, a little time travel, then coffee or lunch in Visegrád – a half or full day out. In the evening, watch the sunset from the heated hot tub."] },
    { id: "hajo", kep: null, hosszu: "hajo", cim: { hu: "Hajókirándulás", en: "Boat trips" },
      rovid: { hu: "Esztergomi és visegrádi körjárat Zebegényből.", en: "Round trips to Esztergom and Visegrád from Zebegény." } },
    { id: "latnivalok", hosszu: "latnivalok", cim: { hu: "Zebegény látnivalói", en: "Sights of Zebegény" }, rovid: { hu: "12 látnivaló a faluban, a templomtól a Héthídig.", en: "12 sights in the village, from the church to the Seven-Arch Bridge." } },
    { id: "kilatok", hosszu: "kilatok", cim: { hu: "10 kilátó a Dunakanyarban", en: "10 viewpoints in the Danube Bend" }, rovid: { hu: "A Csóványostól a Kós Károly-kilátóig.", en: "From Csóványos to the Kós Károly lookout." } },
    { id: "ettermek", hosszu: "ettermek", cim: { hu: "10 étterem a Dunakanyarban", en: "10 restaurants in the Danube Bend" }, rovid: { hu: "Ahol érdemes enni a környéken.", en: "Where to eat nearby." } },
    { id: "elmenyek17", hosszu: "elmenyek17", cim: { hu: "17 élmény a Dunakanyarban", en: "17 experiences in the Danube Bend" }, rovid: { hu: "Kerékpárutak, termálfürdő, kalandok.", en: "Cycle paths, thermal baths, adventures." } }
  ],

  ajandek: {
    hu: ["Névre szóló utalványt küldünk e-mailben, egyedi kóddal. A kódot foglaláskor kell megadni, az utazás időpontja szabadon választható.", "A csomagárak tartalmazzák az elektromosautó-töltést és a jakuzzi használatát, az idegenforgalmi adót (750 Ft/fő/éj) nem.", "Hétköznap és hétvégén is felhasználható; ünnepi és kiemelt időszakban a különbözet megfizetésével. A vásárlástól számított 1 évig érvényes, más kedvezménnyel nem vonható össze."],
    en: ["We email a personalised voucher with a unique code. Enter the code when booking; the travel dates are up to the recipient.", "Package prices include EV charging and use of the hot tub, but not the tourist tax (HUF 750 per person per night).", "Valid on weekdays and weekends; in peak periods the difference is payable. Valid for 1 year from purchase; cannot be combined with other discounts."],
    csomagok: [
      { id: "romantikus", ar: 120000, cim: { hu: "Romantikus hétvége", en: "Romantic weekend" }, leiras: { hu: "2 éjszaka 2 fő részére", en: "2 nights for 2" } },
      { id: "mininaszut", ar: 141000, cim: { hu: "Mini nászút", en: "Mini honeymoon" }, leiras: { hu: "2 éjszaka 2 fő részére + dekoráció, virágcsokor, pezsgő, bonbon", en: "2 nights for 2 + decoration, bouquet, sparkling wine, chocolates" } }
    ]
  },

  gyik: [
    { k: { hu: "Hozhatunk háziállatot?", en: "Can we bring a pet?" }, v: { hu: "Sajnos nem.", en: "Unfortunately not." } },
    { k: { hu: "Mikor foglalhatjuk el a szállást?", en: "When can we check in?" }, v: { hu: "Az érkezés napján 15:00 és 19:00 között. Recepció nincs: kérjük, érkezés előtt egy órával jelezz telefonon vagy e-mailben.", en: "On the day of arrival between 3 pm and 7 pm. There is no reception: please call or email us an hour before you arrive." } },
    { k: { hu: "Mikor kell elhagyni a szállást?", en: "When do we check out?" }, v: { hu: "A távozás napján legkésőbb 10 óráig.", en: "By 10 am on the day of departure." } },
    { k: { hu: "Érkezhetünk korábban, maradhatunk tovább?", en: "Can we arrive early or leave late?" }, v: { hu: "Szabad kapacitás függvényében, 5500 Ft/óra áron. Kérjük, írásban jelezd.", en: "Subject to availability, at HUF 5,500 per hour. Please ask in writing." } },
    { k: { hu: "Van parkoló?", en: "Is there parking?" }, v: { hu: "Igen, minden apartmanhoz díjmentes parkolóhely tartozik, kis tábla jelzi.", en: "Yes, every apartment has a free space, marked with a small sign." } },
    { k: { hu: "Kell fizetni a jakuzziért?", en: "Is the hot tub extra?" }, v: { hu: "Nem, a közös jakuzzit a szállóvendégek díjmentesen használhatják. Érkezés után a lépcsőházi tervezőbe írhatod be az idődet.", en: "No, guests use the shared hot tub free of charge. Book your slot on the planner in the staircase." } },
    { k: { hu: "Hogyan kérhetek reggelit?", en: "How do we order breakfast?" }, v: { hu: "Írásban, 48 órával érkezés előtt (foglaláskor extraként is). Reggel 8-ig az ajtód elé szállítják.", en: "In writing, 48 hours before arrival (or as an extra when booking). It is delivered to your door by 8 am." } },
    { k: { hu: "Dohányozhatunk?", en: "Can we smoke?" }, v: { hu: "A házban és a jakuzziban szigorúan tilos; a kijelölt helyen (erkélyen, teraszon) lehet.", en: "Strictly not inside or in the hot tub; only in designated places (balcony, terrace)." } }
  ]
};

/* A régi oldal önmagának ellentmondó adatai (Ernőnek feltenni; addig az Árak oldal értéke áll fent). */
window.ELTERES = [
  "Reggeli ára: Árak oldal 7000 Ft/fő/alkalom (2 fő 14 000, 3 fő 21 000) – Rólunk/Felszereltség: 2 fős kosár 8000, 3 fős 12 000 Ft.",
  "Lemondás: Árak oldal szerint az érkezés előtti 7. naptól nincs visszatérítés – Házirend szerint a 3. naptól.",
  "TV-csatornák: 126 (apartmankártyák) – 188 (Felszereltség).",
  "Minibár tartalma négyféle változatban (cseh sör / szlovák lager / kézműves sör / rostos üdítő).",
  "Amrita: egy helyen „emeleti, 45 m², privát erkély” – máshol (és a valóságban) földszinti, 40 m², terasz."
];

/* Adatkezelési tájékoztató AZ ÚJ OLDALHOZ (a régi oldalé Google Analytics-et, Facebook Pixelt és más tárhelyet ír le, ide nem igaz).
   TERVEZET – jogi átnézés szükséges; a [szögletes zárójeles] részeket Ernő tölti ki. Az adatkezelő adatai Ernő régi tájékoztatójából. */
window.ADATVEDELEM = {
  hu: [
    ["h", "Ki kezeli az adataidat?"],
    ["p", "Adatkezelő: Ferenczy Ernő Ervin egyéni vállalkozó (Akvarell Apartmanház), székhely: 2627 Zebegény, Csalogány út 1., e-mail: foglalas@akvarellzebegeny.hu, telefon: +36 70 380 6528."],
    ["h", "Milyen adatot kérünk, és miért?"],
    ["p", "Foglalási kérés: név, e-mail-cím, telefonszám (nem kötelező), üzenet, az érkezés és távozás napja, a létszám, a választott extrák és a nyelv. Célja a foglalás egyeztetése és visszaigazolása; jogalapja a szerződés megkötését megelőző lépések (GDPR 6. cikk (1) b)). A megvalósult foglalás adatait a szállásadásra és a számvitelre vonatkozó jogszabályok szerint őrizzük meg (GDPR 6. cikk (1) c))."],
    ["p", "Ajándékutalvány-kérés: név, e-mail-cím, telefonszám (nem kötelező), üzenet. Célja az utalvány elkészítése és elküldése (GDPR 6. cikk (1) b))."],
    ["p", "10-es kihívás: becenév, az állomás és a feltöltött fotó. A fotó csak Ernő jóváhagyása után jelenik meg az oldalon. Jogalapja a hozzájárulásod (GDPR 6. cikk (1) a)), amelyet bármikor visszavonhatsz: írj, és töröljük a képet."],
    ["p", "Technikai adatok: a tárhely (Cloudflare) a biztonságos működés érdekében rövid ideig naplózza a kérések IP-címét (GDPR 6. cikk (1) f), jogos érdek)."],
    ["h", "Sütik és követés"],
    ["p", "Az oldal nem használ sütit, analitikát vagy hirdetési követőkódot. A nyelvválasztást és a kihívás haladását csak a te eszközöd tárolja (helyi tárhely), hozzánk nem jut el."],
    ["h", "Kik férnek hozzá?"],
    ["p", "Ernő és az általa megbízott kezelő. Adatfeldolgozó: Cloudflare, Inc. (tárhely és adatbázis). Az oldal betűtípusai a Google Fonts szolgáltatásból töltődnek be, ezért a böngésződ IP-címe a Google-höz is eljut; a szobaképek Ernő régi weboldaláról töltődnek be. Az időjárás és a vízállás adatait a szerverünk kéri le, ehhez a te adataidat nem használjuk."],
    ["h", "Meddig őrizzük?"],
    ["p", "A meg nem valósult foglalási kérést és az utalványkérést [kitöltendő: pl. 1 évig], a megvalósult foglalás adatait a jogszabályi határidőig, a kihívás-fotót a hozzájárulás visszavonásáig vagy [kitöltendő] őrizzük."],
    ["h", "A jogaid"],
    ["p", "Kérhetsz tájékoztatást, helyesbítést, törlést, korlátozást, adathordozást, és tiltakozhatsz az adatkezelés ellen – írj a fenti e-mail-címre, 30 napon belül válaszolunk. Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz fordulhatsz (1055 Budapest, Falk Miksa utca 9–11., www.naih.hu), vagy bírósághoz."]
  ],
  en: [
    ["h", "Who handles your data?"],
    ["p", "Controller: Ernő Ervin Ferenczy, sole proprietor (Akvarell Apartment House), registered address: 2627 Zebegény, Csalogány út 1., Hungary, email: foglalas@akvarellzebegeny.hu, phone: +36 70 380 6528."],
    ["h", "What we ask for, and why"],
    ["p", "Booking request: name, email, phone (optional), message, arrival and departure dates, number of guests, chosen extras and language. Purpose: to arrange and confirm your booking; legal basis: steps prior to entering into a contract (GDPR Art. 6(1)(b)). Data of completed stays are kept as required by accommodation and accounting law (Art. 6(1)(c))."],
    ["p", "Gift voucher request: name, email, phone (optional), message. Purpose: to prepare and send the voucher (Art. 6(1)(b))."],
    ["p", "10 Challenge: nickname, stop and the uploaded photo. The photo appears on the site only after the owner approves it. Legal basis: your consent (Art. 6(1)(a)), which you can withdraw at any time – write to us and we will delete it."],
    ["p", "Technical data: our host (Cloudflare) briefly logs request IP addresses for secure operation (Art. 6(1)(f), legitimate interest)."],
    ["h", "Cookies and tracking"],
    ["p", "This site uses no cookies, analytics or advertising trackers. Your language choice and challenge progress are stored only on your device (local storage) and never reach us."],
    ["h", "Who has access?"],
    ["p", "The owner and the manager he appoints. Processor: Cloudflare, Inc. (hosting and database). Fonts are loaded from Google Fonts, so your browser's IP address also reaches Google; room photos are loaded from the owner's previous website. Weather and water-level data are fetched by our server without using your data."],
    ["h", "How long we keep it"],
    ["p", "Booking requests that did not result in a stay and voucher requests: [to be completed, e.g. 1 year]; completed stays: as required by law; challenge photos: until consent is withdrawn or [to be completed]."],
    ["h", "Your rights"],
    ["p", "You can request access, rectification, erasure, restriction or portability, and object to processing – write to the email above and we will reply within 30 days. You may complain to the Hungarian data protection authority (NAIH, 1055 Budapest, Falk Miksa utca 9–11., www.naih.hu) or go to court."]
  ]
};
