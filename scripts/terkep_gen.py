#!/usr/bin/env python3
"""A 10-es kihívás térképe: OpenStreetMap-adatokból (© OpenStreetMap közreműködők, ODbL) rajzolt, akvarell hatású SVG.
Használat:
  python3 scripts/terkep_gen.py                 -> scripts/terkep_adat.json-ból újragenerálja a terkep.js-t
  python3 scripts/terkep_gen.py letoltott.osm   -> előbb a nyers OSM-kivonatból (api/0.6/map?bbox=18.8985,47.7930,18.9185,47.8095) elkészíti a terkep_adat.json-t
Az állomások helye és szövege lent, az ALLOMASOK listában van. A terkep.js GENERÁLT, kézzel ne szerkeszd."""
import json, math, sys, os, random
import xml.etree.ElementTree as ET
ITT = os.path.dirname(os.path.abspath(__file__)); ADAT = os.path.join(ITT, 'terkep_adat.json'); KI = os.path.join(ITT, '..', 'terkep.js')
# a térkép kivágása (észak fent): nyugat, dél, kelet, észak
NY, D, K, E = 18.9012, 47.7948, 18.9162, 47.8092
SZ = 600; MPF_LON = 111320 * math.cos(math.radians((D + E) / 2)); MPF_LAT = 111320
MERET_M = (K - NY) * MPF_LON; LEPT = SZ / MERET_M; MAG = round((E - D) * MPF_LAT * LEPT)
def xy(lat, lon): return ((lon - NY) * MPF_LON * LEPT, (E - lat) * MPF_LAT * LEPT)
def tav(a, b): return math.hypot((a[0] - b[0]) * MPF_LAT, (a[1] - b[1]) * MPF_LON)

# Állomások: a hely az OpenStreetMapből (Nominatim, 2026-11-20), a mondat Ernő „Zebegény látnivalói” oldaláról, rövidítve.
# A 8. állomás utcaszintű pont (a Napraforgó-házak és a Maróti-villa pontos helye nincs a térképadatban).
# A 10. állomás (Akvarell) a Csalogány út déli szakaszára került: a pontos helyet Ernő erősítse meg.
ALLOMASOK = [
  (47.8013085, 18.9107827, "Havas Boldogasszony-templom", "Havas Boldogasszony Church",
   "Magyaros szecessziós plébániatemplom a főtéren. Kós Károly, Györgyi Dénes és Jánszky Béla tervei alapján épült 1908 és 1910 között.",
   "Hungarian Art Nouveau parish church on the main square, built between 1908 and 1910 to plans by Károly Kós, Dénes Györgyi and Béla Jánszky."),
  (47.8004407, 18.9117324, "Hajózástörténeti Múzeum", "Museum of Navigation History",
   "Farkas Vincze hajóskapitány itt nyitotta meg az első magyar hajózástörténeti magánmúzeumot. Szőnyi utca 9.",
   "Ship captain Vincze Farkas opened Hungary's first private museum of navigation history here, at Szőnyi utca 9."),
  (47.8006567, 18.9117779, "Sziklakápolna", "Rock Chapel",
   "A Kálvária-domb alján, a szerpentin mentén. A legenda szerint egykor remete élt benne.",
   "At the foot of Calvary Hill, beside the winding path. Legend has it that a hermit once lived in it."),
  (47.8009622, 18.9126606, "Trianoni emlékmű – Országzászló", "Trianon Memorial – National Flag",
   "Maróti Géza úgy tervezte az Országzászlót és a Hősi emléket a Kálvária-dombon, hogy a Duna felől már több kilométerről látsszon.",
   "Géza Maróti designed the National Flag and the Heroes' Memorial on Calvary Hill to be seen from the Danube from several kilometres away."),
  (47.7994770, 18.9138341, "Kós Károly-kilátó", "Kós Károly Lookout",
   "2015 nyarán avatták, Csóka Árpád tervezte. Zebegényre, a Dunára és a Pilisre látsz róla.",
   "Opened in summer 2015, designed by Árpád Csóka. It looks over Zebegény, the Danube and the Pilis."),
  (47.7978993, 18.9125254, "Szőnyi István Emlékmúzeum", "Szőnyi István Memorial Museum",
   "A festő egykori lakóháza és műterme. Szőnyi István 1924-től haláláig itt élt és alkotott. Bartóky utca 7.",
   "The painter's former home and studio. István Szőnyi lived and worked here from 1924 until his death. Bartóky utca 7."),
  (47.7964766, 18.9108311, "Hétlyukú híd – „Héthíd”", "Seven-Arch Bridge",
   "Hétnyílású vasúti völgyhíd, 1965 óta műemlék. A zebegényiek Héthídnak hívják.",
   "A seven-arch railway viaduct, a listed monument since 1965. Locals simply call it Héthíd."),
  (47.7970300, 18.9095400, "Napraforgó utca", "Napraforgó Street",
   "A Héthíd árkádjai alatt átsétálva, a falu egykori főútján állnak a Dunára néző Napraforgó-házak. Maróti Géza is ebben az utcában építette villáját 1913-ban.",
   "Walk under the arches of the bridge to the village's former main road and the Sunflower Houses facing the Danube. Géza Maróti built his villa in this street in 1913."),
  (47.7997693, 18.9078002, "Duna-part, hajóállomás", "Danube bank, boat station",
   "A Duna partja a hajóállomásnál. Szemben a túlpart: Pilismarót.",
   "The bank of the Danube at the boat station. Across the water: Pilismarót."),
  (47.8073000, 18.9040900, "Akvarell Apartmanház", "Akvarell Apartment House",
   "Vissza a házhoz. A tizedik kép itt készül.",
   "Back at the house. The tenth picture is taken here."),
]
AKV = (ALLOMASOK[-1][0], ALLOMASOK[-1][1])
# a számok elhelyezése a sűrű falumagban: (dx, dy) eltolás térképegységben, a pontot vékony vonal köti a számhoz
ELTOL = {1: (-34, -22), 2: (-40, 26), 3: (36, -30), 4: (44, 6), 5: (34, 20), 6: (36, 14), 7: (34, 22), 8: (-36, 18), 9: (-34, -10), 10: (30, -26)}

def kivonat(osm):
    r = ET.parse(osm).getroot()
    N = {n.get('id'): (float(n.get('lat')), float(n.get('lon'))) for n in r.iter('node')}
    tg = lambda e: {t.get('k'): t.get('v') for t in e.findall('tag')}
    ki = {'ut': [], 'osveny': [], 'fout': [], 'vasut': [], 'patak': [], 'erdo': [], 'part': [], 'tulpart': [], 'sziget': []}
    bent = lambda g: any(D - .002 < p[0] < E + .002 and NY - .003 < p[1] < K + .003 for p in g)
    for w in r.iter('way'):
        t = tg(w); g = [N[x.get('ref')] for x in w.findall('nd') if x.get('ref') in N]; i = w.get('id')
        if len(g) < 2: continue
        if i == '551440442': ki['part'].append(g); continue
        if i in ('478894067', '478894076'): ki['tulpart'].append(g); continue
        if i == '344475658': ki['sziget'].append(g); continue
        if not bent(g): continue
        h = t.get('highway')
        if h == 'primary': ki['fout'].append(g)
        elif h in ('residential', 'living_street', 'unclassified', 'tertiary', 'secondary'): ki['ut'].append(g)
        elif h in ('footway', 'path', 'steps', 'track', 'cycleway', 'pedestrian') and t.get('footway') != 'sidewalk': ki['osveny'].append(g)
        elif t.get('railway') == 'rail' and t.get('service') is None: ki['vasut'].append(g)
        elif t.get('waterway') == 'stream': ki['patak'].append(g)
        elif t.get('natural') == 'wood' or t.get('landuse') == 'forest': ki['erdo'].append(g)
    json.dump({k: [[[round(a, 6), round(b, 6)] for a, b in g] for g in v] for k, v in ki.items()}, open(ADAT, 'w'), separators=(',', ':'))

def egyszerusit(p, tur):                      # Douglas–Peucker térképegységben
    if len(p) < 3: return p
    (x1, y1), (x2, y2) = p[0], p[-1]; h = math.hypot(x2 - x1, y2 - y1) or 1e-9
    d = [abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1)) / h for x, y in p[1:-1]]
    i = max(range(len(d)), key=d.__getitem__)
    if d[i] <= tur: return [p[0], p[-1]]
    return egyszerusit(p[:i + 2], tur)[:-1] + egyszerusit(p[i + 1:], tur)
def vag(p, m=60):                              # csak a kivágás közelébe eső szakaszok
    ki, most = [], []
    for q in p:
        if -m < q[0] < SZ + m and -m < q[1] < MAG + m: most.append(q)
        else:
            if len(most) > 1: ki.append(most)
            most = []
    if len(most) > 1: ki.append(most)
    return ki
def d(p, zar=False): return 'M' + 'L'.join(f'{x:.0f} {y:.0f}' for x, y in p) + ('Z' if zar else '')
def vonalak(L, tur=1.2): return ''.join(d(egyszerusit(s, tur)) for g in L for s in vag([xy(*q) for q in g]))

def general():
    A = json.load(open(ADAT)); random.seed(7)
    P = [xy(a[0], a[1]) for a in ALLOMASOK]
    part = [q for g in A['part'] for q in g]                                    # a zebegényi part nyugatról keletre
    viz = [xy(*q) for q in part] + [xy(47.75, 18.97), xy(47.75, 18.84), xy(47.83, 18.84)]
    tul = [q for g in reversed(A['tulpart']) for q in g]
    tul = sorted({tuple(q) for q in tul}, key=lambda q: q[0])
    tulp = [xy(*q) for q in tul] + [xy(tul[-1][0], 18.88), xy(tul[0][0], 18.88)]
    P = [xy(a[0], a[1]) for a in ALLOMASOK]
    kor = [P[-1]] + P                                                             # Akvarell → 1 … 9 → Akvarell
    hely = [(ALLOMASOK[-1][0], ALLOMASOK[-1][1])] + [(a[0], a[1]) for a in ALLOMASOK]
    tavok = [int(round(tav(hely[i], hely[i + 1]) / 10) * 10) for i in range(10)]
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SZ} {MAG}" role="img" aria-labelledby="tk-cim"><title id="tk-cim">Zebegény térképe a tíz állomással</title><defs>'
         '<filter id="tk-folt" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>'
         '<filter id="tk-ecset" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="1" seed="8"/><feDisplacementMap in="SourceGraphic" scale="2.5"/></filter>'
         '<filter id="tk-szurke"><feColorMatrix type="saturate" values=".03"/><feComponentTransfer><feFuncR type="linear" slope=".5" intercept=".47"/><feFuncG type="linear" slope=".5" intercept=".46"/><feFuncB type="linear" slope=".5" intercept=".43"/></feComponentTransfer></filter>'
         '<filter id="tk-lagy" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>'
         '<radialGradient id="tk-viz" cx="20%" cy="60%" r="90%"><stop offset="0" stop-color="#9cc7dd"/><stop offset=".6" stop-color="#6fa9c9"/><stop offset="1" stop-color="#4f8fb5"/></radialGradient>'
         f'<clipPath id="tk-keret"><rect width="{SZ}" height="{MAG}" rx="18"/></clipPath>'
         '<g id="tk-rajz">'
         f'<rect width="{SZ}" height="{MAG}" fill="#f3e9cf"/>']
    # föld: halvány zöld és okker foltok
    for _ in range(14):
        s.append(f'<ellipse cx="{random.randint(150, SZ)}" cy="{random.randint(0, MAG)}" rx="{random.randint(90, 190)}" ry="{random.randint(70, 150)}" fill="{random.choice(["#cfe0a0", "#ecd58f", "#bcd79a", "#f0cf8e", "#d8e6a8"])}" opacity=".62" filter="url(#tk-folt)"/>')
    s.append('<g filter="url(#tk-folt)">')
    for g in A['erdo']:
        p = [xy(*q) for q in g]
        if any(0 < x < SZ and 0 < y < MAG for x, y in p): s.append(f'<path d="{d(egyszerusit(p, 2), True)}" fill="#8fb27a" opacity=".6"/>')
    s.append(f'<path d="{d(egyszerusit(viz, 1.5), True)}" fill="url(#tk-viz)" opacity=".92"/>')
    s.append(f'<path d="{d(egyszerusit(tulp, 1.5), True)}" fill="#cfdcae" opacity=".95"/>')
    for g in A['sziget']: s.append(f'<path d="{d(egyszerusit([xy(*q) for q in g], 1.5), True)}" fill="#ead9a4"/>')
    s.append('</g>')
    # állomásonként egy festékfolt (a szürke rétegen alig látszik, a színesen kivirul)
    SZIN = ["#d9774a", "#3f8fb0", "#8a6aa6", "#c94f4f", "#e0a93a", "#d9774a", "#7a8f9e", "#e6b93c", "#3f8fb0", "#c94f4f"]
    s.append('<g filter="url(#tk-folt)">' + ''.join(f'<ellipse cx="{x + random.randint(-12, 12):.0f}" cy="{y + random.randint(-12, 12):.0f}" rx="{random.randint(40, 58)}" ry="{random.randint(32, 48)}" fill="{SZIN[i]}" opacity=".42"/>' for i, (x, y) in enumerate(P)) + '</g>')
    # a víz fénycsíkjai
    s.append('<g fill="none" stroke="#fff" stroke-linecap="round" opacity=".35" filter="url(#tk-ecset)">' + ''.join(f'<path d="M{x} {y}q14 -5 30 0" stroke-width="{w}"/>' for x, y, w in [(30, 520, 2), (60, 610, 1.5), (22, 400, 1.5), (120, 700, 2), (250, 800, 1.5), (80, 760, 2), (40, 300, 1.5)]) + '</g>')
    s.append('<g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#tk-ecset)">'
             f'<path d="{vonalak(A["patak"])}" stroke="#6fa9c9" stroke-width="2.5" opacity=".8"/>'
             f'<path d="{vonalak(A["osveny"], 1.5)}" stroke="#b08a5a" stroke-width="1.3" stroke-dasharray="1 5" opacity=".8"/>'
             f'<path d="{vonalak(A["ut"])}" stroke="#fffaf0" stroke-width="5.5"/><path d="{vonalak(A["ut"])}" stroke="#c9a877" stroke-width="1" opacity=".55"/>'
             f'<path d="{vonalak(A["fout"])}" stroke="#e9b86a" stroke-width="7"/><path d="{vonalak(A["fout"])}" stroke="#fff6dd" stroke-width="3"/>'
             f'<path d="{vonalak(A["vasut"])}" stroke="#4a4038" stroke-width="3.2"/><path d="{vonalak(A["vasut"])}" stroke="#f3e9cf" stroke-width="1.6" stroke-dasharray="7 7"/>'
             '</g>')
    s.append('<g font-family="Literata,Georgia,serif" font-style="italic" fill="#2c6a89" opacity=".8"><text x="34" y="470" font-size="30" transform="rotate(-78 34 470)">Duna</text></g>'
             '')
    s.append('</g>')                                                                # tk-rajz vége
    # színező maszk: a megtett állomások körül a térkép kiszíneződik (a .be osztályt az app.js adja)
    s.append('<mask id="tk-maszk" maskUnits="userSpaceOnUse" x="0" y="0" width="%d" height="%d"><rect class="tk-mind" width="%d" height="%d" fill="#fff"/><g filter="url(#tk-lagy)">' % (SZ, MAG, SZ, MAG)
             + ''.join(f'<circle class="tk-m" data-a="{i + 1}" cx="{x:.0f}" cy="{y:.0f}" r="{120 if i == 9 else 92}" fill="#fff"/>' for i, (x, y) in enumerate(P)) + '</g></mask></defs>')
    s.append('<g clip-path="url(#tk-keret)"><use href="#tk-rajz" filter="url(#tk-szurke)"/><use href="#tk-rajz" mask="url(#tk-maszk)"/>')
    # a séta sorrendje (nem útvonal: egyenes összekötés)
    s.append(f'<path d="{d(kor + [P[-1]])}" fill="none" stroke="#8a4b2a" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round" opacity=".7"/>')
    for i, (x, y) in enumerate(P):
        dx, dy = ELTOL[i + 1]; cx, cy = x + dx, y + dy
        s.append(f'<g class="tk-a" data-a="{i + 1}"><line x1="{x:.0f}" y1="{y:.0f}" x2="{cx:.0f}" y2="{cy:.0f}" stroke="#1d2a35" stroke-width="1.2"/><circle cx="{x:.0f}" cy="{y:.0f}" r="3.5" fill="#1d2a35"/>'
                 + (f'<path class="tk-k" d="M{cx - 17:.0f} {cy + 13:.0f}v-17l17 -13l17 13v17z" stroke="#1d2a35" stroke-width="1.5" stroke-linejoin="round"/>' if i == 9 else f'<circle class="tk-k" cx="{cx:.0f}" cy="{cy:.0f}" r="15" stroke="#1d2a35" stroke-width="1.5"/>')
                 + f'<text x="{cx:.0f}" y="{cy + (6 if i == 9 else 5.5):.0f}" text-anchor="middle" font-family="Source Sans 3,system-ui,sans-serif" font-weight="700" font-size="{14 if i == 9 else 16}">{i + 1}</text></g>')
    ax, ay = P[-1]; s.append(f'<text x="{ax + 54:.0f}" y="{ay - 22:.0f}" font-family="Literata,Georgia,serif" font-weight="600" font-size="17" fill="#1d2a35">Akvarell</text>')
    # lépték és észak
    m200 = 200 * LEPT
    s.append(f'<g transform="translate({SZ - m200 - 22:.0f} {MAG - 24})" font-family="Source Sans 3,system-ui,sans-serif" font-size="12" fill="#1d2a35"><path d="M0 0h{m200:.0f}M0 -4v8M{m200:.0f} -4v8" stroke="#1d2a35" stroke-width="1.5" fill="none"/><text x="{m200 / 2:.0f}" y="-7" text-anchor="middle">200 m</text></g>'
             f'<g transform="translate({SZ - 34} 40)" fill="#1d2a35"><path d="M0 -18l7 20l-7 -5l-7 5z"/><text y="18" text-anchor="middle" font-family="Source Sans 3,system-ui,sans-serif" font-size="12" font-weight="700">É</text></g></g></svg>')
    svg = ''.join(s)
    adat = {'svg': svg, 'ossz_m': sum(tavok), 'allomasok': [{'lat': a[0], 'lon': a[1], 'nev': {'hu': a[2], 'en': a[3]}, 'szoveg': {'hu': a[4], 'en': a[5]}, 'tav': tavok[i]} for i, a in enumerate(ALLOMASOK)]}
    open(KI, 'w', encoding='utf8').write('/* GENERÁLT: scripts/terkep_gen.py. Kézzel ne szerkeszd. Térképadat: © OpenStreetMap közreműködők (ODbL). */\nwindow.TERKEP = ' + json.dumps(adat, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('terkep.js:', os.path.getsize(KI) // 1024, 'kB ·', SZ, 'x', MAG, '· szakaszok (m):', tavok, '· összesen:', sum(tavok))

if len(sys.argv) > 1: kivonat(sys.argv[1])
general()
