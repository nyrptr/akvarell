#!/usr/bin/env python3
"""A saját CSS/JS hivatkozások ?v=<tartalom-hash> paramétert kapnak (különben a telefon a régi fájlt futtathatja).
Minden CSS/JS-módosítás után futtasd: python3 tools/verzio.py"""
import hashlib, re, pathlib
GY = pathlib.Path(__file__).resolve().parents[1]
def h(ut): return hashlib.sha1((GY / ut.lstrip('/')).read_bytes()).hexdigest()[:8]
for html in ["index.html", "admin/index.html"]:
    p = GY / html; s = p.read_text()
    def cs(m):
        attr, ut = m.group(1), m.group(2)
        alap = ut if ut.startswith('/') else ('/' + str((pathlib.Path(html).parent / ut)).lstrip('./'))
        return f'{attr}="{ut}?v={h(alap)}"'
    s2 = re.sub(r'(src|href)="((?!https?:)[^"?#]+\.(?:js|css))(?:\?v=[0-9a-f]+)?"', cs, s)
    if s2 != s: p.write_text(s2); print("frissítve:", html)
