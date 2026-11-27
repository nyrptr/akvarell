"""Fotóposzt PWA-változat bélyegzése: a sw.js VALTOZAT-ja = az app fájljainak hash-e.
Kiadás előtt: python3 tools/fotoposzt_pwa.py   (ellenőrzés: --ellenoriz → kilépési kód 1, ha elavult)
Ha a VALTOZAT nem változik, a telepített app nem veszi észre az új kiadást."""
import hashlib,pathlib,re,sys
d=pathlib.Path(__file__).resolve().parent.parent/'fotoposzt'
h=hashlib.sha256()
for n in ['index.html','app.js','betolto.js','tervezo.js','frissites.js','manifest.webmanifest']:h.update((d/n).read_bytes())
v=h.hexdigest()[:12]
sw=(d/'sw.js').read_text(encoding='utf8');m=re.search(r"const VALTOZAT='([^']*)';",sw)
if '--ellenoriz' in sys.argv:
    ok=m and m.group(1)==v;print('PWA-változat '+('rendben' if ok else f'ELAVULT ({m.group(1) if m else "?"} ≠ {v}) – futtasd: python3 tools/fotoposzt_pwa.py'));sys.exit(0 if ok else 1)
(d/'sw.js').write_text(sw.replace(m.group(0),f"const VALTOZAT='{v}';"),encoding='utf8');print('VALTOZAT',v)
