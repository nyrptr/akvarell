#!/usr/bin/env python3
"""hazak/<ház>/haz.json -> hazak/<ház>/haz.js (böngésző: window.HAZ) és functions/_kozos/haz.js (szerver: export const HAZ).
Használat: python3 scripts/haz_gen.py [ház] [--ellenoriz]  (--ellenoriz: nem ír, 1-es kóddal kilép, ha a generált fájl elavult)"""
import json, sys, os
gy = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
a = [x for x in sys.argv[1:] if not x.startswith('--')]; haz = a[0] if a else 'akvarell'
d = json.load(open(os.path.join(gy, 'hazak', haz, 'haz.json'), encoding='utf-8')); d.pop('_leiras', None)
js = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
ki = {os.path.join('hazak', haz, 'haz.js'): '/* GENERÁLT (scripts/haz_gen.py) a haz.json-ból. Kézzel ne szerkeszd. */\nwindow.HAZ = ' + js + ';\n',
      os.path.join('functions', '_kozos', 'haz.js'): '// GENERÁLT (scripts/haz_gen.py) a hazak/' + haz + '/haz.json-ból. Kézzel ne szerkeszd.\nexport const HAZ = ' + js + ';\n'}
# a ház szerver-szövegei (ES-modul) -> functions/_kozos/szerver.js
sz = open(os.path.join(gy, 'hazak', haz, 'tartalom', 'szerver.js'), encoding='utf-8').read()
ki[os.path.join('functions', '_kozos', 'szerver.js')] = '// GENERÁLT (scripts/haz_gen.py) a hazak/' + haz + '/tartalom/szerver.js-ből. Kézzel ne szerkeszd.\n' + sz
# a motor közös magja (ES-modul) -> böngészős másolat (window.ARMAG); ház-független, ezért ház nélkül is generálódik
import re
for mag in ['ar-mag']:
    forr = open(os.path.join(gy, 'motor', mag + '.js'), encoding='utf-8').read()
    nevek = re.findall(r'^export (?:function|const) (\w+)', forr, re.M)
    torzs = re.sub(r'^export ', '', forr, flags=re.M)
    ki[os.path.join('motor', mag + '.browser.js')] = ('/* GENERÁLT (scripts/haz_gen.py) a motor/' + mag + '.js-ből. Kézzel ne szerkeszd. */\n(function () {\n' + torzs +
        'window.' + mag.replace('-', '').upper() + ' = { ' + ', '.join(nevek) + ' };\n})();\n')
# a nyitólap és a kezelő oldala sablonból (motor/sablon/*.html) a haz.json adataival; a ?v= hash-eket a tools/verzio.py frissíti, itt a meglévőket megtartjuk
import html as _h
def _ertek(k):
    v = d
    for r in k.split('.'): v = v[r]
    return v
def sablon(sab, cel):
    t = open(os.path.join(gy, 'motor', 'sablon', sab), encoding='utf-8').read()
    def jsonld():
        o = dict(d['oldal']['jsonld']); kep = d['oldal']['alap_url'] + d['kepmappa'] + d['kepek']['hero']
        o = {'@context': o.pop('@context'), '@type': o.pop('@type'), 'name': d['teljes_nev'], 'image': kep, **o}
        return json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    t = t.replace('{{JSONLD}}', jsonld()).replace('{{HAZ_MAPPA}}', haz)
    t = re.sub(r'\{\{([a-z_.]+)\}\}', lambda m: _h.escape(str(_ertek(m.group(1))), quote=True), t)
    p = os.path.join(gy, cel)
    if os.path.exists(p):
        reg = open(p, encoding='utf-8').read()
        hash_ = {m.group(1): m.group(2) for m in re.finditer(r'(?:src|href)="([^"?#]+\.(?:js|css))\?v=([0-9a-f]+)"', reg)}
        t = re.sub(r'(?:src|href)="((?!https?:)[^"?#]+\.(?:js|css))"', lambda m: m.group(0)[:-1] + ('?v=' + hash_[m.group(1)] if m.group(1) in hash_ else '') + '"', t)
    return t
ki['index.html'] = sablon('index.html', 'index.html')
ki[os.path.join('admin', 'index.html')] = sablon('admin.html', os.path.join('admin', 'index.html'))
rossz = 0
for ut, tart in ki.items():
    p = os.path.join(gy, ut)
    if '--ellenoriz' in sys.argv:
        if not os.path.exists(p) or open(p, encoding='utf-8').read() != tart: print('ELAVULT', ut); rossz = 1
    else: open(p, 'w', encoding='utf-8').write(tart); print('írva', ut)
# a kezdő adatbázis-töltés (functions/_kozos/telepit.js) ugyanabból a házból
import subprocess
rossz |= subprocess.call([sys.executable, os.path.join(gy, 'scripts', 'telepit_gen.py'), haz] + (['--ellenoriz'] if '--ellenoriz' in sys.argv else []), cwd=gy, stdout=subprocess.DEVNULL if '--ellenoriz' not in sys.argv else None) != 0
sys.exit(rossz)
