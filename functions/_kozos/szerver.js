// GENERÁLT (scripts/haz_gen.py) a hazak/akvarell/tartalom/szerver.js-ből. Kézzel ne szerkeszd.
// A ház szerver-oldali szövegei (levelek, heti bejegyzés, naptár-fájl, alapértelmezett értékelés-linkek).

export const SZ = {
  ua: 'akvarell-taj github.com/nyrptr/akvarell',
  info_email: 'info@akvarellzebegeny.hu',
  fajl: 'akvarell',                                   // letöltött fájlok neve (kezelő: hírlevél-CSV, mentés)
  cimke: 'akvarell',                                  // a levélküldő szolgáltatóban a levelek címkéje
  naptar: { prodid: 'Akvarell Zebegeny', neve: 'Akvarell', uid: 'akvarell', ua: 'akvarell-naptar' },
  ertekeles: { booking_url: 'https://www.booking.com/hotel/hu/akvarell-apartmanhaz.html', szallas_url: 'https://szallas.hu/zebegeny' },
  level: {
    felado: 'Akvarell Apartmanház', fejlec: 'Akvarell Apartmanház · Zebegény', oldal_cim: 'Akvarell', oldal_nev: 'Akvarell Apartmanház',
    kezelo_targy: 'Akvarell kezelő – belépő link', kezelo_szoveg: (perc) => `Ezzel a linkkel beléphetsz az Akvarell kezelőjébe. ${perc} percig érvényes, és egyszer használható.`,
    ajanlat_targy: { hu: 'Megkaptuk a foglalási kérésedet – Akvarell', en: 'We have received your booking request – Akvarell' },
    kartya_targy: { hu: 'Az Akvarell vendégkártyád', en: 'Your Akvarell guest card' },
    visszaig_targy: { hu: 'Visszaigazoltuk a foglalásodat – Akvarell, Zebegény', en: 'Your stay is confirmed – Akvarell, Zebegény' },
    elotte_targy: { hu: 'Még három nap – érkezés Zebegénybe', en: 'Three days to go – arriving in Zebegény' },
    ertekeles_szoveg: { hu: 'Köszönjük, hogy az Akvarellt választottad. Pár őszinte mondat sokat segít a következő vendégeknek és nekünk is.', en: 'Thank you for staying at Akvarell. A few honest words help other guests – and us – a lot.' },
  },
  blog: {
    bevez_hu: 'Mire számíthatsz Zebegényben a hétvégén (péntek–vasárnap)? Néhány friss, hivatalos adat, a hét ajánlata, és hogy hol van még hely.',
    bevez_en: "What to expect in Zebegény this weekend (Friday to Sunday)? A few fresh, official figures, this week's tip, and where there is still room.",
    napl_cim_hu: 'Naplemente a jakuzziból', napl_cim_en: 'Sunset from the hot tub',
    napl_hu: (ny) => `Szombaton ${ny}-kor megy le a nap Zebegényben (csillagászati számítás). A fűthető, közös jakuzzi a kertben a Dunakanyarra néz.`,
    napl_en: (ny) => `On Saturday the sun sets in Zebegény at ${ny} (astronomical calculation). The heated, shared hot tub in the garden overlooks the Danube Bend.`,
    duna_hu: (D, merce) => `${merce}nál ${D.cm} cm${D.vizho != null ? `, a víz ${Math.round(D.vizho)} °C` : ''} (OVF vízügyi adat, a bejegyzés készítésekor).`,
    duna_en: (D, merce) => `At ${merce}: ${D.cm} cm${D.vizho != null ? `, water ${Math.round(D.vizho)} °C` : ''} (Hungarian water authority, OVF, at the time of writing).`,
    cim_hu: (d) => `Zebegényi hét – ${d} hétvége`, cim_en: (d) => `Zebegény this week – weekend of ${d}`,
    temak: [
      { id: 'komp', hu: ['Komppal Visegrádra', 'A Nagymaros–Visegrád komp egész évben, minden órában közlekedik. A túlparton a Fellegvár vár, este pedig a jakuzziból nézheted a naplementét.'], en: ['By ferry to Visegrád', 'The Nagymaros–Visegrád ferry runs every hour all year. The citadel waits on the far bank, and in the evening you can watch the sunset from the hot tub.'] },
      { id: 'kilatok', hu: ['Kilátó a falu fölött', 'A Kós Károly-kilátó néhány perc sétára van a főtértől: Zebegényre, a Dunára és a Pilisre néz.'], en: ['A lookout above the village', 'The Károly Kós lookout is a few minutes\' walk from the village square, looking over Zebegény, the Danube and the Pilis hills.'] },
      { id: 'masszazs', hu: ['Masszázs a házban', 'Svéd- vagy gyógymasszázs 45, 60 vagy 90 percben – 3–4 héttel érkezés előtt érdemes kérni.'], en: ['Massage in the house', 'Swedish or therapeutic massage for 45, 60 or 90 minutes – best requested 3–4 weeks before arrival.'] },
      { id: 'latnivalok', hu: ['Szőnyi István nyomában', 'A festő egykori háza és műterme ma emlékmúzeum a faluban, Bartóky utca 7.'], en: ['In the footsteps of István Szőnyi', 'The painter\'s former home and studio is now a memorial museum in the village, at Bartóky utca 7.'] },
      { id: 'ebike', hu: ['E-bike-kal a Dunakanyarban', 'Budapesttől Szobig 70 km kiépített kerékpárút; elektromos kerékpárral az emelkedők sem gond.'], en: ['E-bikes in the Danube Bend', '70 km of cycle path from Budapest to Szob; with an e-bike, the hills are no problem.'] },
      { id: 'kihivas', hu: ['Zebegény 10-es kihívás', 'Tíz állomás a faluban, mindegyiknél egy szelfi. Az utolsó állomás az Akvarell.'], en: ['Zebegény 10 Challenge', 'Ten stops around the village, a selfie at each. The last stop is Akvarell.'] },
    ],
  },
};
