# Kampánymenedzser / kampánytanácsadó – követelmény és terv (ZSEBMARKETING, 2026-11-27)
Állapot: Péter kérése rögzítve; a terv AI-javaslat, Péter jóváhagyására vár. A Tervező 1. változata (sima 4 hetes lista) ezt NEM teljesíti – Péter: „ez csak egy sima lista… hol van itt a kampánymenedzser”.

## Te mondtad (11-27, a szavaidhoz közel)
- „nem kötötted hozzá eseményekhez, nincs benne naptár, nem tudod, hogy karácsony van… itt egy kampánymenedzserről van szó. Körül kell nézni, mi a helyzet Zebegényben, hogy néz ki a turizmus. Mindent figyelembe kell venni.”
- „az Akvarellről már van egy tonna tudásunk… fel tudjuk építeni a profilját… szedjük be az információt még.”
- „ajánlhatjuk neki: figyelj, ezt és ezt kéne csinálnod, mert Zebegényben vagy… miért ezt csináld. Az első kampány: javasoljuk, hogy így és így építsd fel. Minél tömörebben. Úgy csinálja, ahogy akarja.”
- „Ha nincs kész képe… sétálj, ma ha tudsz, csinálj egy képet… az elején leszögezzük, hogy kampányt csinálunk, innentől kézen kell fogni a felhasználót.”
- „ugyanaz a kampány többfelé megosztva, német, angol… hova kell osztani? Nézd meg, milyen beállítások vannak a Metában, a Google-ben… mit kell tudnunk, hogy tökéletes legyen a posztunk… több kampány is megy, egyik ide, másik oda.”
- Fotós-segéd: „érzi-e, jó-e a kép, kicsit hátrébb, fókusz, perspektíva, kicsit lejjebbről… mit tud egy fotós, és mit tudunk a kezébe adni.”

## Javaslatom (AI-javaslat)
```mermaid
flowchart TD
  B[Bemenet: ügyfélprofil + helyi naptár + ünnepek/szünetek + foglalási ablak + időjárás + eddigi eredmény] --> J[1 Javasolt kampány: mit, miért most, miért nálad – 3 mondat]
  J --> BR[2 Brief: cél · kinek · ígéret · fő üzenet · meddig · siker-szám]
  BR --> F[3 Fázisok: felvezetés → fő hét → utolsó hívás → utána; események az idővonalon]
  F --> C[4 Csatorna és nyelv: melyik közönség, melyik felület, HU/EN/DE változat]
  C --> H[5 Heti kézenfogás: e heti posztok, ma fotózd ezt, így állunk]
  H -->|heti felülvizsgálat| J
```
- Forrás-alap: foglalási ablak – a szabadidős utazók többsége 1–3 hónappal előre tervez és foglal (TravelBoom 2026, revenue-hub.com); helyi naptár: pl. Zebegény Meseadvent 12.01–12.24 (programturizmus.hu); a kampányok szezonra előre (houfy.com playbook).
- Következő lépés (kutatás): Meta (közönség, nyelv, elhelyezés, formátum-méretek) és Google (Cégprofil-poszt, hirdetés) – mit kell tudnia a posztnak, hogy a beállításoknak megfeleljen; több párhuzamos kampány.

## Kampánytípusok – szálláshely-szakmai alapon (Péter, 11-27: „üres napok feltöltése, vagy bármi más… ez kicsit gyenge”)
AI-javaslat; minden típusnak van kiváltója (mi indítja) – a kampánymenedzser ebből javasol, az ügyfél dönt.
| Kiváltó | Kampány | Forrás |
|---|---|---|
| Foglalási naptár: lyuk két foglalás között | Üres napok feltöltése (rés-éjszakák), rövid átfutás | sendsquared.com gap night |
| Naptár: üres hétköznapok | Hétköznapi ajánlat (pl. alkotói/pihenő hét) | guesty.com weekday |
| Előző évek: 30% alatti 14 napos szakasz | Holtszezon-kampány | guesty.com off-season |
| Ünnep/szünet a foglalási ablakban (1–3 hó) | Kiemelt időszak korai foglalásra (szilveszter, húsvét, nyári szünet) | TravelBoom 2026 |
| Helyi esemény a naptárban | Esemény-kampány (Meseadvent, nyári hajó, fesztivál) | programturizmus.hu |
| Rövid foglalások túlsúlya | Hosszabb tartózkodás (pl. 7 éj kedvezmény – az Akvarellnek már van) | hostfully.com |
| Sok OTA-foglalás | Közvetlen foglalás (jutalék nélkül) | sendsquared.com |
| Korábbi vendégek | Visszahívás / ajánlás / értékelés | vacasa.com |
| Új nyelvi piac | Ismertség (DE/EN közönség) | Meta ODAX |
| Prémium egység (jacuzzi, Deluxe) | Felértékelés / élménycsomag (romantikus hétvége) | – |
Kemény határ: ár, kedvezmény, csomag = az ügyfél döntése (pénz); a menedzser csak javasol, indokkal.
Adatforrás, ami nálunk már megvan: az Akvarell saját foglalási rendszere (functions/_kozos/naptar.js iCal-szinkron) – a rés-éjszakák gépi felismeréséhez.
