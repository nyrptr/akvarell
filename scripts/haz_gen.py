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
rossz = 0
for ut, tart in ki.items():
    p = os.path.join(gy, ut)
    if '--ellenoriz' in sys.argv:
        if not os.path.exists(p) or open(p, encoding='utf-8').read() != tart: print('ELAVULT', ut); rossz = 1
    else: open(p, 'w', encoding='utf-8').write(tart); print('írva', ut)
sys.exit(rossz)
