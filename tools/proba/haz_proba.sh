#!/usr/bin/env bash
# Egy ház vázának (vagy bármely háznak) próbája a motoron: a tároló másolatán a ház adataival legenerál mindent, és lefuttatja a ház-független próbákat.
# Használat: bash tools/proba/haz_proba.sh <ház-mappa> [út …]    (pl. szegfu33; utak nélkül mind a végigjátszott utak)
# Nem módosítja a munkamappát (ideiglenes másolat). A böngészős próbák (kapu.py, lapozas) a házhoz kötött oldalakat nézik, ezek itt nincsenek.
set -euo pipefail
H="${1:?használat: haz_proba.sh <ház-mappa> [út …]}"; shift || true
GY="$(cd "$(dirname "$0")/../.." && pwd)"; T="$(mktemp -d /tmp/haz-proba-XXXXXX)"; trap 'rm -rf "$T"' EXIT
[ -f "$GY/hazak/$H/haz.json" ] || { echo "Nincs hazak/$H/haz.json"; exit 2; }
tar -C "$GY" --exclude=.git --exclude=node_modules --exclude=tmp -cf - . | tar -C "$T" -xf -
cd "$T"; [ -d "$GY/node_modules" ] && ln -s "$GY/node_modules" node_modules || true
python3 scripts/haz_gen.py "$H" >/dev/null && python3 scripts/telepit_gen.py "$H"
echo "── $H: árpróba"; node tools/proba/ar_teszt.mjs | tail -1
echo "── $H: végigjátszott utak"; node tools/proba/utak/fut.mjs "$@" 2>&1 | grep -E "^──|HIBA|FAIL|hibás|lépés" | tail -40
