"""Fotóposzt claude.ai-os változata (artifact, slug 69f9b8bb-09e8-4c5b-8d77-28724d6bdc22) ugyanabból a commitból.
Használat: python3 tools/fotoposzt_artifact.py <kimeneti mappa>
- index.html: a betolto.js helyére az app.js és a tervezo.js kerül (11-27-től) ('<script>\\n' + app.js + '</script>') – az artifactban nincs külön szkriptbetöltés.
- A felismero/helyek-emb.json és a zene/ változatlanul megy; a .tflite modellek az artifactban base64-JSON-ként élnek (hely_embedder.json, modell.json) – csak akkor kell újra feltölteni, ha a .tflite változott.
Igazolva 2026-11-27: a 069e87a fotoposzt/ ebből bájtra azonos a v17 artifacttal (sha256 13aa2d86…).
Kiadás: a munka-fotoposzt ágra tolás (Cloudflare-előnézet magától) + ennek a kimenetnek a feltöltése ugyanarra a slugra."""
import sys,hashlib,pathlib,shutil
src=pathlib.Path(__file__).resolve().parent.parent/'fotoposzt'; out=pathlib.Path(sys.argv[1]); out.mkdir(parents=True,exist_ok=True)
h=(src/'index.html').read_text(encoding='utf8'); a=(src/'app.js').read_text(encoding='utf8')
tag='<script src="betolto.js"></script>'
assert h.count(tag)==1,'a betolto.js-tag pontosan egyszer kell'
t=(src/'tervezo.js').read_text(encoding='utf8')+'</script>\n<script>\n'+(src/'zseb.js').read_text(encoding='utf8')
fr=(src/'frissites.js').read_text(encoding='utf8'); ftag='<script src="frissites.js"></script>'
assert h.count(ftag)==1
h=h.replace(ftag,'<script>\n'+fr+'</script>')
h=h.replace(tag,'<script>\n'+a+'</script>\n<script>\n'+t+'</script>')
(out/'index.html').write_text(h,encoding='utf8')
shutil.copytree(src/'bemutato',out/'bemutato',dirs_exist_ok=True)
(out/'felismero').mkdir(exist_ok=True); shutil.copy(src/'felismero'/'helyek-emb.json',out/'felismero'/'helyek-emb.json')
print('index.html',hashlib.sha256(h.encode()).hexdigest()[:8],len(h.encode()))
