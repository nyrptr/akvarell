// VÁZ – helyőrző szerver-szövegek (scripts/haz_vaz.py)
// A ház szerver-oldali szövegei (levelek, heti bejegyzés, naptár-fájl, alapértelmezett értékelés-linkek).

export const SZ = {
  ua: 'Szegfű33-taj github.com/nyrptr/Szegfű33',
  info_email: 'info@vaz.invalid',
  fajl: 'Szegfű33',                                   // letöltött fájlok neve (kezelő: hírlevél-CSV, mentés)
  cimke: 'Szegfű33',                                  // a levélküldő szolgáltatóban a levelek címkéje
  naptar: { prodid: 'Szegfű33 Zebegeny', neve: 'Szegfű33', uid: 'Szegfű33', ua: 'Szegfű33-naptar' },
  ertekeles: { booking_url: 'https://vaz.invalid/', szallas_url: 'https://vaz.invalid/' },
  level: {
    felado: 'Szegfű33 vendégház', fejlec: 'Szegfű33 vendégház · Zebegény', oldal_cim: 'Szegfű33', oldal_nev: 'Szegfű33 vendégház',
    kezelo_targy: 'Szegfű33 kezelő – belépő link', kezelo_szoveg: (perc) => `Ezzel a linkkel beléphetsz az Szegfű33 kezelőjébe. ${perc} percig érvényes, és egyszer használható.`,
    ajanlat_targy: { hu: 'Megkaptuk a foglalási kérésedet – Szegfű33', en: 'We have received your booking request – Szegfű33' },
    kartya_targy: { hu: 'Az Szegfű33 vendégkártyád', en: 'Your Szegfű33 guest card' },
    visszaig_targy: { hu: 'Visszaigazoltuk a foglalásodat – Szegfű33, Zebegény', en: 'Your stay is confirmed – Szegfű33, Zebegény' },
    elotte_targy: { hu: 'Még három nap – érkezés Zebegénybe', en: 'Three days to go – arriving in Zebegény' },
    ertekeles_szoveg: { hu: 'Köszönjük, hogy az Szegfű33t választottad. Pár őszinte mondat sokat segít a következő vendégeknek és nekünk is.', en: 'Thank you for staying at Szegfű33. A few honest words help other guests – and us – a lot.' },
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
      { id: 'vaz', hu: ['[VÁZ]', '[VÁZ]'], en: ['[VÁZ]', '[VÁZ]'] },
    ],
  },
};
