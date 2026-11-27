# t37: az index.html elemei rendben záródnak (11-28: egy elcsúszott </div> miatt a 4. lépés szövege más füleken is látszott)
import sys, pathlib
from html.parser import HTMLParser
s = pathlib.Path(__file__).resolve().parents[2].joinpath('fotoposzt/index.html').read_text()
body = s[s.index('<body'):]
VOID = {'br','img','input','meta','link','hr','source','area','col','embed','param','track','wbr'}
st, bad = [], []
class P(HTMLParser):
    def handle_starttag(self, t, a):
        if t not in VOID: st.append((t, self.getpos()[0]))
    def handle_endtag(self, t):
        if t in VOID or t in ('html', 'body'): return
        if st and st[-1][0] == t: st.pop()
        else: bad.append(f'{t} a {self.getpos()[0]}. sorban (nyitva: {st[-1] if st else None})')
P().feed(body)
nyitva = [x for x in st if x[0] not in ('body', 'html')]
for x in bad: print('HIBA rossz zárás:', x)
for x in nyitva: print('HIBA nyitva maradt:', x)
print(f'{len(bad) + len(nyitva)} HIBA')
