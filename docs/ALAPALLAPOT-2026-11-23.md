# Alapállapot a motor szétválasztása előtt · 2026-11-23 · KAPOCS-chat
Commit (main): `f0300c55ec1faaf3e2af5eaf8f68791d585627ed`. A szétválasztás ehhez az állapothoz képest nem változtathat működést.
Futtatva ezen a commiton:
- `node tools/proba/gyar_szabalyok.mjs` → 0 HIBA
- `TZ=Europe/Budapest node tools/proba/ar_teszt.mjs` → 1467 eset, 0 HIBA
- `node tools/proba/utak/fut.mjs` → 5 út, 0 hibás (foglalás, kártya, visszatérő, szinkron, próba)
NEM futott: `kapu.py` (böngészős, 320/390/gép), `access_teszt.mjs`. Ezek a szétválasztás minden PR-jánál kötelezőek.
Biztonsági rend: egy lépés egy PR; adatbázis nem változik; Péter egyesít a `main`-be; nyitott PR-ok (#30–#32, kezelő-belépés) a pillanatképen kívül maradnak.
