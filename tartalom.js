/* Beégetett tartalom: ebből jelenik meg az oldal akkor is, ha az adatbázis nem elérhető.
   Ugyanez van az adatbázisban (D1); ha ott frissebb, az oldal azt mutatja. */
window.TARTALOM = {
  kep: "https://akvarellzebegeny.hu/wp-content/uploads/2024/05/",
  apartmanok: [
    {
      id: "szonyi", sorrend: 1, nev: "Szőnyi",
      emelet_hu: "emelet", emelet_en: "upstairs", m2: 45, fo: 3,
      agy_hu: "franciaágy és ágyazható kanapé", agy_en: "double bed and sofa bed",
      kiemeles_hu: "A hálóból és a fürdőből is a Dunára lát.",
      kiemeles_en: "River views from the bedroom and even the bathroom.",
      leiras_hu: "Az emeleti Szőnyi apartman nagy ablakai a Dunakanyarra néznek: a víz és a Visegrádi-hegység a nappaliból, a hálószobából és a fürdőszobából is látszik. 45 m², franciaágy és ágyazható kanapé, felszerelt konyha és terasz. Két felnőttnek tágas, egy harmadik vendég a kanapéágyon alszik.",
      leiras_en: "The upstairs Szőnyi apartment looks out over the Danube Bend through large windows: the river and the Visegrád Hills are in view from the living room, the bedroom and even the bathroom. 45 m², a double bed and a sofa bed, a fully equipped kitchen and a terrace. Roomy for two, with a sofa bed for a third guest.",
      festo_hu: "Szőnyi István a Dunakanyar festője: Zebegényben élt, és itt készültek legfontosabb képei. Egykori háza és műterme ma múzeum a faluban, kertjében ma is festészeti szabadiskola működik.",
      festo_en: "István Szőnyi is known as the painter of the Danube Bend. He lived in Zebegény and painted his most important works here. His former house and studio is now a museum in the village, and a free painting school still runs in its garden.",
      ar_hetkoznap: 52000, ar_hetvege: 58000, ar3_hetkoznap: 78000, ar3_hetvege: 87000,
      kepek: ["Szonyi-apartman-nappali-halo.jpg", "Szonyi-apartman-furdo-kilatas.jpg", "Szonyi-apartman-haloszoba.jpg", "Szonyi-apartman-konyha-nappali.jpg"]
    },
    {
      id: "bereny", sorrend: 2, nev: "Berény",
      emelet_hu: "emelet", emelet_en: "upstairs", m2: 45, fo: 3,
      agy_hu: "franciaágy és ágyazható kanapé", agy_en: "double bed and sofa bed",
      kiemeles_hu: "Terasz a víz fölött, Duna-kilátás a fürdőből is.",
      kiemeles_en: "A terrace above the water, river views from the bathroom too.",
      leiras_hu: "Emeleti apartman nagy ablakokkal: a Dunakanyar a hálószobából és a fürdőszobából is látszik. 45 m², franciaágy és ágyazható kanapé, felszerelt konyha, terasz kilátással a vízre. Két felnőttnek tágas, egy harmadik vendég a kanapéágyon alszik.",
      leiras_en: "An upstairs apartment with large windows: the Danube Bend is in view from the bedroom and even the bathroom. 45 m², a double bed and a sofa bed, a fully equipped kitchen and a terrace overlooking the river. Roomy for two, with a sofa bed for a third guest.",
      festo_hu: "Berény Róbert Kossuth- és Munkácsy-díjas festőművész 1934-től ideje nagy részét Zebegényben töltötte, és itt festette több ismert képét.",
      festo_en: "Róbert Berény, winner of the Kossuth and Munkácsy Prizes, spent most of his time in Zebegény from 1934 and painted several of his best-known works here.",
      ar_hetkoznap: 52000, ar_hetvege: 58000, ar3_hetkoznap: 78000, ar3_hetvege: 87000,
      kepek: ["Bereny-apartman-nappali.jpg", "Bereny-terasz-kilatas.jpg", "Bereny-apartman-halo.jpg", "Bereny-apartman-furdo.jpg"]
    },
    {
      id: "amrita", sorrend: 3, nev: "Amrita",
      emelet_hu: "földszint", emelet_en: "ground floor", m2: 40, fo: 3,
      agy_hu: "franciaágy és ágyazható kanapé", agy_en: "double bed and sofa bed",
      kiemeles_hu: "Nagy terasz a Dunára és a Börzsönyre, üvegfalú fürdő.",
      kiemeles_en: "A large terrace facing the Danube and the Börzsöny hills, a glass-walled bathroom.",
      leiras_hu: "Földszinti apartman külön hálótérrel és nagy terasszal, ahonnan a Duna és a Börzsöny vonulatai látszanak. A fürdőszoba üvegfalú, így a panoráma zuhanyzás közben is látszik. 40 m², franciaágy és ágyazható kanapé, felszerelt konyha. Két főre készült, pótággyal hárman is elférnek.",
      leiras_en: "A ground-floor apartment with a separate sleeping area and a large terrace facing the Danube and the Börzsöny hills. The bathroom has glass walls, so the view stays with you in the shower. 40 m², a double bed and a sofa bed, a fully equipped kitchen. Designed for two, with room for a third guest on the sofa bed.",
      festo_hu: "Amrita Sher-Gil India egyik legismertebb festője, félig magyar volt, és több nyarat töltött Zebegényben. Saját szavai szerint Delhi és London között Zebegény volt számára a világ közepe.",
      festo_en: "Amrita Sher-Gil, one of India's best-known painters, was half Hungarian and spent several summers in Zebegény. In her own words, between Delhi and London, Zebegény was the centre of the world.",
      ar_hetkoznap: 42000, ar_hetvege: 48000, ar3_hetkoznap: 63000, ar3_hetvege: 72000,
      kepek: ["Amrita-apartman-nappali.jpg", "Amrita-apartman-halo.jpg", "Amrita-apartman-furdo.jpg", "Amrita-apartman-konyha.jpg"]
    },
    {
      id: "karpathy", sorrend: 4, nev: "Kárpáthy",
      emelet_hu: "földszint", emelet_en: "ground floor", m2: 40, fo: 3,
      agy_hu: "franciaágy és ágyazható kanapé", agy_en: "double bed and sofa bed",
      kiemeles_hu: "Nagy terasz a naplementékre, üvegfalú fürdő.",
      kiemeles_en: "A large terrace for the sunsets, a glass-walled bathroom.",
      leiras_hu: "Földszinti apartman külön hálótérrel és nagy terasszal, ahonnan a Dunakanyar naplementéi látszanak. A fürdőszoba üvegfalú, így a panoráma zuhanyzás közben is látszik. 40 m², franciaágy és ágyazható kanapé, felszerelt konyha. Két főre készült, pótággyal hárman is elférnek.",
      leiras_en: "A ground-floor apartment with a separate sleeping area and a large terrace for watching the sunset over the Danube Bend. The bathroom has glass walls, so the view stays with you in the shower. 40 m², a double bed and a sofa bed, a fully equipped kitchen. Designed for two, with room for a third guest on the sofa bed.",
      festo_hu: "Kárpáthy Jenő festőművész Zebegényben élt és alkotott; olajképein többször megfestette a Dunát és a zebegényi tájat.",
      festo_en: "The painter Jenő Kárpáthy lived and worked in Zebegény, and painted the Danube and the Zebegény landscape many times in oil.",
      ar_hetkoznap: 42000, ar_hetvege: 48000, ar3_hetkoznap: 63000, ar3_hetvege: 72000,
      kepek: ["Karpathy-apartman-nappali.jpg", "Karpathy-terasz.jpg", "Karpathy-apartman-halo.jpg", "Karpathy-apartman-nappali-2.jpg"]
    }
  ],
  szoveg: {
    cim: { hu: "Akvarell Apartmanház", en: "Akvarell Apartment House" },
    alcim: { hu: "Négy apartman Zebegényben, panorámával a Dunára, a Pilisre és a Visegrádi-hegységre.", en: "Four apartments in Zebegény, with views of the Danube, the Pilis and the Visegrád Hills." },
    bevezeto: { hu: "Mind a négy apartman egy-egy festőről kapta a nevét, aki Zebegényben élt vagy alkotott. Közös kültéri jakuzzi, elektromosautó-töltő, ingyenes parkolás és wifi.", en: "Each of the four apartments is named after a painter who lived or worked in Zebegény. Shared outdoor hot tub, EV charger, free parking and Wi-Fi." },
    gyerek: { hu: "3–13 éves gyermek: 15 000 Ft/éj. 3 év alatt ingyenes. Egy éjszakás foglalás felára: 20 000 Ft. Idegenforgalmi adó: 750 Ft/fő/éj, 18 év felett.", en: "Children aged 3–13: HUF 15,000 per night; under 3 free. One-night stay surcharge: HUF 20,000. Tourist tax: HUF 750 per person per night, over 18." },
    kihivas_cim: { hu: "Zebegény 10-es kihívás", en: "Zebegény 10 Challenge" },
    kihivas_bev: { hu: "Tíz állomás a faluban, mindegyiknél egy szelfi. Nem szervezett túra: akkor indul, amikor kedve van. Az utolsó állomás az Akvarell.", en: "Ten stops around the village, a selfie at each. No guided tour: start whenever you like. The last stop is Akvarell." },
    ajandek: { hu: "", en: "" },          // a tíz állomás jutalma; amíg Ernő nem dönt róla, üres, és nem jelenik meg
    uzemelteto: { hu: "Üzemeltető: Ferenczy Ernő Ervin egyéni vállalkozó · 2627 Zebegény, Csalogány utca 4.", en: "Operator: Ernő Ervin Ferenczy, sole proprietor · 2627 Zebegény, Csalogány utca 4" }
  },
  allomasok: ["Zebegényi strand", "Napraforgó Babapark", "Hétlyukú híd", "Fischer köz", "Szőnyi István Emlékmúzeum", "Hirling köz", "Sziklakápolna", "Országzászló és Trianon-emlékmű", "Havas Boldogasszony-templom", "Akvarell Apartmanház"]
};
