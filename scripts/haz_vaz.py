#!/usr/bin/env python3
"""Új ház üres váza: hazak/<mappa>/ a motor szerkezetével, helyőrző szövegekkel ([VÁZ]) – a motor-teszteket futtatni lehet rajta.
Használat: python3 scripts/haz_vaz.py <mappa> "<név>" "<teljes név>" "<hely>"   (pl. szegfu33 "Szegfű33" "Szegfű33 vendégház" "Zebegény")
Forrás-szerkezet: hazak/akvarell/. Semmi nem kerül élesbe: a váz csak a hazak/<mappa>/ alatt van, az oldal nem hivatkozik rá."""
import json, os, re, sqlite3, subprocess, sys
gy = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
if len(sys.argv) != 5: sys.exit(__doc__)
mappa, nev, teljes, hely = sys.argv[1:]
F = os.path.join(gy, 'hazak', 'akvarell'); C = os.path.join(gy, 'hazak', mappa)
if os.path.exists(C): sys.exit('Már van: hazak/' + mappa)
for d in ('tartalom', 'db', 'kepek'): os.makedirs(os.path.join(C, d))
subprocess.check_call(['node', os.path.join(gy, 'scripts', '_vaz_tartalom.mjs'), os.path.join(F, 'tartalom'), os.path.join(C, 'tartalom'), nev, teljes])
HAZSZO = re.compile(r'akvarell(?:zebegeny)?(?: apartmanház)?|szőnyi|szonyi|berény|bereny|amrita|kárpáthy|karpathy|ferenczy|ernő', re.I)
# szerver-szövegek: a házszavak cseréje; a heti témák szövege helyőrző
sz = open(os.path.join(F, 'tartalom', 'szerver.js'), encoding='utf-8').read()
i = sz.index('temak: ['); j = sz.index('\n    ],', i)
sz = sz[:i] + 'temak: [\n      { id: \'vaz\', hu: [\'[VÁZ]\', \'[VÁZ]\'], en: [\'[VÁZ]\', \'[VÁZ]\'] },' + sz[j:]
sz = sz.replace('info@akvarellzebegeny.hu', 'info@vaz.invalid')
sz = re.sub(r'https://[^\'"`\s]*(?:akvarell|booking|szallas)[^\'"`\s]*', 'https://vaz.invalid/', sz)
sz = HAZSZO.sub(lambda m: teljes if 'apartmanház' in m.group(0).lower() else nev, sz)
open(os.path.join(C, 'tartalom', 'szerver.js'), 'w', encoding='utf-8').write('// VÁZ – helyőrző szerver-szövegek (scripts/haz_vaz.py)\n' + sz)
# haz.json
h = json.load(open(os.path.join(F, 'haz.json'), encoding='utf-8'))
h['_leiras'] = 'VÁZ (scripts/haz_vaz.py): helyőrző értékek – az árak, a cím, az „oldal” szövegei és a hosszú hétvégék a ház saját adatai szerint töltendők. Nem éles.'
h.update(azonosito=mappa[:3], nev=nev, teljes_nev=teljes, hely=hely, cim='[VÁZ] cím', regi_oldal='', kepmappa='/hazak/' + mappa + '/kepek/')
h['kepek'] = {k: 'vaz.jpg' for k in h['kepek']}
h['arcsoportok'] = [{'id': 'egy', 'cim': nev}]
h['ar']['hosszu_hetvegek'] = []
h['oldal'].update(alap_url='https://vaz.invalid', cim=teljes + ' – ' + hely, leiras='[VÁZ]', og_cim=teljes, og_leiras='[VÁZ]', logo_szo=nev, kezelo_cim=nev + ' – kezelő')
h['oldal']['jsonld'] = {'@context': 'https://schema.org', '@type': 'LodgingBusiness', 'name': teljes, 'address': {'@type': 'PostalAddress', 'addressLocality': hely, 'addressCountry': 'HU'}}
json.dump(h, open(os.path.join(C, 'haz.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2); open(os.path.join(C, 'haz.json'), 'a').write('\n')
open(os.path.join(C, 'kepek', 'lista.js'), 'w').write('window.HELYI_KEPEK = {};\n')
# adatbázis: egy apartman, a tartalom-sorok helyőrzővel
db = sqlite3.connect(':memory:'); db.executescript(open(os.path.join(gy, 'db', 'schema.sql'), encoding='utf-8').read()); db.executescript(open(os.path.join(F, 'db', 'seed.sql'), encoding='utf-8').read())
ap = db.execute('SELECT * FROM apartman ORDER BY sorrend LIMIT 1'); oszl = [c[0] for c in ap.description if c[0] != 'frissitve']; sor = dict(zip([c[0] for c in ap.description], ap.fetchone()))
for k, v in sor.items():
    if isinstance(v, str): sor[k] = '[VÁZ]'
sor.update(id='egy', sorrend=1, nev=nev, kepek='[]'); sor.pop('frissitve', None)
q = lambda v: 'NULL' if v is None else (str(v) if isinstance(v, (int, float)) else "'" + str(v).replace("'", "''") + "'")
out = ['-- VÁZ (scripts/haz_vaz.py): helyőrző kezdő tartalom', 'INSERT OR REPLACE INTO apartman (' + ','.join(oszl) + ') VALUES (' + ','.join(q(sor[c]) for c in oszl) + ');']
for kulcs, hu, en in db.execute('SELECT kulcs, hu, en FROM tartalom ORDER BY kulcs'):
    out.append('INSERT OR REPLACE INTO tartalom (kulcs,hu,en) VALUES (' + ','.join(q('' if x == '' else '[VÁZ]') for x in (kulcs, hu, en)).replace("'[VÁZ]'", "'" + kulcs + "'", 1) + ');')
open(os.path.join(C, 'db', 'seed.sql'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('Váz kész: hazak/' + mappa + '/')
