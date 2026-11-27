#!/usr/bin/env bash
# Egy parancs, minden PR előtti próba (KAPOCS-chat, 2026-11-23: a kézi indítás hibaforrás volt).
# Futtatás: bash tools/proba/mind.sh   → a végén "MIND RENDBEN" vagy a hibás lépés neve; a helyi szervert maga indítja és leállítja.
# A kapu.py 3 ismert helyi hibája (api/taj 503, OVF) megengedett; bármi más hiba bukás.
cd "$(dirname "$0")/../.." || exit 1
ros=0; bukik() { echo "BUKÁS: $1"; ros=1; }
python3 scripts/haz_gen.py --ellenoriz || bukik "generált ház-fájl elavult (python3 scripts/haz_gen.py)"
node tools/proba/gyar_szabalyok.mjs | tail -1 | grep -q '^0 HIBA' || bukik gyar_szabalyok
TZ=Europe/Budapest node tools/proba/ar_teszt.mjs | tail -1 | grep -q ' 0 HIBA' || bukik ar_teszt
node tools/proba/belepes_teszt.mjs >/dev/null 2>&1 || bukik belepes_teszt
node tools/proba/access_teszt.mjs >/dev/null 2>&1 || bukik access_teszt
node tools/proba/utak/fut.mjs >/dev/null 2>&1 || bukik utak
for h in $(ls hazak | grep -vx akvarell); do bash tools/proba/haz_proba.sh "$h" >/dev/null 2>&1 || bukik "haz_proba:$h"; done   # a többi ház váza a motoron
M=$(mktemp -d)
WRANGLER_SEND_METRICS=false CI=1 setsid npx --yes wrangler pages dev . --port 8788 --d1 DB=proba --persist-to "$M" --binding HELYI_KEZELO=igen --binding LEVEL_PROBA=igen --binding OLDAL_URL=http://localhost:8788 >/tmp/wr-mind.log 2>&1 &
SZ=$!
for i in $(seq 1 90); do curl -s -o /dev/null -w "%{http_code}" http://localhost:8788/api/adat | grep -q 200 && break; sleep 2; done
L=$(python3 tools/proba/lapozas_proba.py --url http://localhost:8788 2>&1); echo "$L" | tail -4
echo "$L" | tail -1 | grep -q ' 0 HIBA' || bukik lapozas_proba
K=$(python3 tools/proba/kapu.py --url http://localhost:8788 --kepek tmp/kapu 2>&1)
pkill -f "wrangler pages dev" 2>/dev/null; kill "$SZ" 2>/dev/null
echo "$K" | grep "^HIBA" | grep -vE "api/(zebegeny|taj)" | head -10; echo "$K" | tail -4
HIB=$(echo "$K" | grep '^HIBA' | grep -vcE 'api/(zebegeny|taj)')
[ "$HIB" = 0 ] || bukik "kapu.py ($HIB új hiba)"
echo "$K" | tail -1 | grep -qE '^[0-9]+ hiba · képek:' || bukik "kapu.py nem futott végig (nincs záró összesítő sor – összeomlás vagy időtúllépés)"   # T-024 rokon: a csendben összeomló próba nem lehet zöld
[ $ros = 0 ] && echo "MIND RENDBEN" || exit 1
