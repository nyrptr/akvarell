#!/usr/bin/env python3
"""Háromrétegű tudás: motor (app.js) + szakmacsomag + ügyfélcsomag.
Összefésülés: a szakma az alap, az ügyfél felülírja (azonos kulcs / azonos id).
Használat:
  python3 tools/fotoposzt_csomag.py szetvalaszt   # egyszeri: index.html keszlet -> szakma/szallas + ugyfel/akvarell
  python3 tools/fotoposzt_csomag.py epit          # ugyfel/akvarell + szakmája -> index.html keszlet
  python3 tools/fotoposzt_csomag.py --ellenoriz   # 0 HIBA, ha az index.html keszlet = összefésült csomag
"""
import json, re, sys, pathlib
GY = pathlib.Path(__file__).resolve().parent.parent / 'fotoposzt'
IDX = GY / 'index.html'
SZ, UG = GY / 'csomagok' / 'szakma', GY / 'csomagok' / 'ugyfel'
ALAP = 'akvarell'
MINTA = re.compile(r'(<script id="keszlet"[^>]*>)(.*?)(</script>)', re.S)

def olvas(p): return json.loads(p.read_text(encoding='utf-8'))
def ir(p, d): p.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

def fesul(szakma, ugyfel):
    """Szakma + ügyfél → futó készlet. Tömb: id szerint, ügyfél nyer; szótár: kulcsonként, ügyfél nyer."""
    k = {}
    for kulcs in list(szakma) + [x for x in ugyfel if x not in szakma]:
        if kulcs in ('szakma_meta',):
            continue
        a, b = szakma.get(kulcs), ugyfel.get(kulcs)
        if isinstance(a, list) and isinstance(b, list):
            ids = {x.get('id') for x in b if isinstance(x, dict)}
            k[kulcs] = [x for x in a if not (isinstance(x, dict) and x.get('id') in ids)] + b
        elif isinstance(a, dict) and isinstance(b, dict):
            k[kulcs] = {**a, **b}
        else:
            k[kulcs] = b if b is not None else a
    k['szakma'] = szakma.get('szakma_meta', {})
    k.pop('szakma_id', None)
    return k

def epitett():
    u = olvas(UG / f'{ALAP}.json')
    s = olvas(SZ / f"{u['szakma_id']}.json")
    return fesul(s, u)

def index_keszlet():
    return json.loads(MINTA.search(IDX.read_text(encoding='utf-8')).group(2))

def kanon(k):
    """Összehasonlításhoz: tömbök id szerint rendezve (a sorrend a motorban nem számít)."""
    def r(v):
        if isinstance(v, list) and all(isinstance(x, dict) and 'id' in x for x in v):
            return sorted((r(x) for x in v), key=lambda x: x['id'])
        if isinstance(v, dict): return {a: r(b) for a, b in v.items()}
        if isinstance(v, list): return [r(x) for x in v]
        return v
    return json.dumps(r(k), ensure_ascii=False, sort_keys=True)

SZAKMA_ZARO = {'z1', 'z3', 'z4', 'z6', 'z7', 's-tel'}
SZAKMA_KOMMENT = {'m1'}
SZALLAS_META = {
    'id': 'szallas', 'nev': 'Szállásadó',
    'celok': ['foglalás', 'üzenet / érdeklődés', 'weboldal-látogatás'],
    'vevout': ['meglát', 'elképzeli magát ott', 'megnézi a szállást', 'ír vagy foglal', 'eljön', 'visszajön / ajánl'],
    'temak_alap': ['kilátás', 'szoba', 'terasz / kert', 'reggeli / étel', 'környék', 'évszak'],
    'fotolista': ['a ház kívülről nappal', 'minden szoba világosban', 'kilátás az ablakból', 'reggeli / terített asztal',
                  'a legközelebbi látnivaló', 'ugyanaz a nézet négy évszakban'],
    'cta': 'foglalás', 'tilos': ['kommentkérés', 'garantált', 'csak ma', 'a legjobb']}

def szetvalaszt():
    k = index_keszlet()
    sz = {'szakma_meta': SZALLAS_META,
          'tudtad': k['tudtad'],
          'zaro': [z for z in k['zaro'] if z['id'] in SZAKMA_ZARO],
          'komment': [m for m in k['komment'] if m['id'] in SZAKMA_KOMMENT]}
    u = {'szakma_id': 'szallas'}
    for a, b in k.items():
        if a == 'tudtad': continue
        if a == 'zaro': b = [z for z in b if z['id'] not in SZAKMA_ZARO]
        if a == 'komment': b = [m for m in b if m['id'] not in SZAKMA_KOMMENT]
        u[a] = b
    ir(SZ / 'szallas.json', sz); ir(UG / f'{ALAP}.json', u)
    print('szétválasztva:', SZ / 'szallas.json', UG / f'{ALAP}.json')

def epit():
    h = IDX.read_text(encoding='utf-8')
    k = epitett()
    uj = MINTA.sub(lambda m: m.group(1) + json.dumps(k, ensure_ascii=False, separators=(',', ':')) + m.group(3), h, count=1)
    IDX.write_text(uj, encoding='utf-8'); print('index.html keszlet frissítve')

def ellenoriz():
    hiba = []
    for p in list(SZ.glob('*.json')):
        d = olvas(p)
        m = d.get('szakma_meta', {})
        if m.get('id') != p.stem: hiba.append(f'{p.name}: szakma_meta.id != fájlnév')
        for kell in ('nev', 'celok', 'fotolista', 'cta', 'tilos'):
            if kell not in m: hiba.append(f'{p.name}: hiányzik szakma_meta.{kell}')
        if 'ceg' in d: hiba.append(f'{p.name}: ügyféladat (ceg) a szakmacsomagban')
    for p in UG.glob('*.json'):
        d = olvas(p)
        if not (SZ / f"{d.get('szakma_id','?')}.json").exists(): hiba.append(f'{p.name}: ismeretlen szakma_id')
        if not d.get('ceg', {}).get('hely') or not isinstance(d.get('temak'), list): hiba.append(f'{p.name}: ceg.hely / temak hiányzik')
    try:
        e, i = epitett(), index_keszlet()
        if kanon(e) != kanon(i): hiba.append('index.html keszlet eltér az összefésült csomagtól (futtasd: epit)')
    except Exception as x:
        hiba.append(f'összefésülés: {x}')
    for h in hiba: print('HIBA:', h)
    print(f'{len(hiba)} HIBA'); return 1 if hiba else 0

if __name__ == '__main__':
    a = sys.argv[1] if len(sys.argv) > 1 else '--ellenoriz'
    sys.exit({'szetvalaszt': lambda: szetvalaszt() or 0, 'epit': lambda: epit() or 0}.get(a, ellenoriz)())
