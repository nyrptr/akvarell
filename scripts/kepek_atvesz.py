#!/usr/bin/env python3
"""Ernő képeinek saját másolata a kepek/ mappába, hogy az oldal ne függjön az ő tárhelyétől (2026-11-20: az akvarellzebegeny.hu 502/504-et adott, és minden kép eltűnt).
Használat: python3 scripts/kepek_atvesz.py  → letölti, ami még nincs meg (legfeljebb 1600 px széles, JPEG 82%), és újraírja a kepek/lista.js-t.
A képek Ernő saját fotói az ő szálláshelyéről; csak az ő oldalán használjuk."""
import os, re, sys, json, urllib.request, io
from PIL import Image
GY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); KI = os.path.join(GY, 'kepek')
ALAP = 'https://akvarellzebegeny.hu/wp-content/uploads/2024/05/'
nevek, cimek = set(), {}
for f in ['app.js'] + ['hazak/akvarell/tartalom/' + x for x in ['tartalom.js', 'oldalak.js', 'oldalak_hosszu.js', 'oldalak_hosszu_en.js', 'blog_alap.js']] + ['db/seed.sql', 'index.html']:
    t = open(os.path.join(GY, f), encoding='utf8').read()
    for m in re.finditer(r'https://akvarellzebegeny\.hu/wp-content/uploads/[0-9/]+([A-Za-z0-9_.-]+\.(?:jpe?g|png|webp))', t): cimek[m.group(1)] = m.group(0)
    nevek |= set(re.findall(r'(?<![A-Za-z0-9_.-])([A-Za-z0-9_][A-Za-z0-9_.-]*\.(?:jpe?g|png|webp))', t))
nevek = {n for n in nevek if not n.startswith(('profil', 'og-'))}
megvan, hiba = [], []
for n in sorted(nevek):
    cel = os.path.join(KI, n)
    if os.path.exists(cel): megvan.append(n); continue
    try:
        r = urllib.request.urlopen(urllib.request.Request(cimek.get(n, ALAP + n), headers={'user-agent': 'akvarell-bemutato'}), timeout=30)
        if not r.headers.get('content-type', '').startswith('image/'): raise ValueError(r.headers.get('content-type'))
        k = Image.open(io.BytesIO(r.read())); k = k.convert('RGB')
        if k.width > 1600: k = k.resize((1600, round(k.height * 1600 / k.width)))
        k.save(cel, 'JPEG', quality=82, optimize=True, progressive=True); megvan.append(n)
    except Exception as e: hiba.append((n, str(e)[:80]))
open(os.path.join(KI, 'lista.js'), 'w').write('/* GENERÁLT: scripts/kepek_atvesz.py. A saját másolattal rendelkező képek listája. */\nwindow.HELYI_KEPEK = ' + json.dumps({n: 1 for n in sorted(megvan)}) + ';\n')
# a hosszú szövegekben más mappából vagy más oldalról hivatkozott képek nincsenek ebben a mappában: ezek teljes címmel szerepelnek, nem a kep()-en át
print(len(megvan), 'kép megvan;', len(hiba), 'nincs a 2024/05 mappában (teljes címmel hivatkozott):', ', '.join(h[0] for h in hiba))
