#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$ROOT/guides/5-gun-introduction-mistakes.pdf"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=20000 \
  --print-to-pdf="$OUT" "file://$ROOT/scripts/guide.html"
echo "Wrote $OUT"
