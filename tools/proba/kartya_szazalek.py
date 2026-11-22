# Próba: a kezelőben beállított visszatérő-kedvezmény a QR-ról megnyitott kártyaoldalon is a valódi százalék (5 → „5%”, 0 → nincs ígéret).
# Futtatás: helyi szerver (HELYI_KEZELO=igen) mellett: python3 -I tools/proba/kartya_szazalek.py [http://localhost:8790]
import sys, json, urllib.request
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8790'
def beall(v):
    r = urllib.request.Request(B + '/admin/api/beallitasok', data=json.dumps({'visszatero_kedvezmeny': str(v)}).encode(), headers={'content-type': 'application/json'}); urllib.request.urlopen(r).read()
hiba = 0
def ok(f, mit):
    global hiba
    print(('  OK   ' if f else '  HIBA ') + mit); hiba += 0 if f else 1
with sync_playwright() as p:
    br = p.chromium.launch()
    try:
        for v, van, nincs in ((5, '5%', '10%'), (0, None, '10%'), (10, '10%', None)):
            beall(v); c = br.new_context(locale='hu-HU'); pg = c.new_page(); pg.goto(B + '/#/kartya'); pg.wait_for_timeout(2500)
            t = pg.inner_text('#fo'); c.close()
            if van: ok(van in t, f'beállítás {v}%: a kártyaoldal „{van}”-ot ír')
            if nincs: ok(nincs not in t, f'beállítás {v}%: a kártyaoldal nem ír „{nincs}”-ot')
    finally:
        beall(10); br.close()
print('kartya_szazalek:', hiba, 'HIBA'); sys.exit(1 if hiba else 0)
