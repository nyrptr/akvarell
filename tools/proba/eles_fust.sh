#!/usr/bin/env bash
# Beolvasztás utáni füstpróba az éles (vagy más) címen; csak olvas, semmit nem küld be. Használat: bash tools/proba/eles_fust.sh [https://akvarell.pages.dev]
U="${1:-https://akvarell.pages.dev}"; ros=0
for ut in / /hazak/akvarell/haz.js /api/adat /admin/; do
  k=$(curl -s -o /dev/null -w "%{http_code}" "$U$ut"); echo "$ut $k"; [ "$k" = 200 ] || ros=1
done
cd "$(dirname "$0")/../.." || exit 1
curl -s "$U/hazak/akvarell/haz.js" | cmp -s - hazak/akvarell/haz.js && echo "haz.js egyezik a tárolóéval" || { echo "haz.js ELTÉR a tárolóétól"; ros=1; }
[ $ros = 0 ] && echo "FÜST RENDBEN" || { echo "FÜST HIBA"; exit 1; }
