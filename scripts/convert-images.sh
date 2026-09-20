#!/usr/bin/env bash
# Write a WebP twin beside every raster under frontend/public/images.
#
# webpSrc() in frontend/src/utils/imageFallback.js points every .jpg/.jpeg/.png
# path at its .webp twin before the browser asks for it, so a raster without a
# twin costs a 404 and a fallback round trip on every view. This script is what
# keeps that assumption true; it was referenced in that comment long before it
# existed in the repo.
#
# Safe to re-run: an existing twin is left alone, so the usual run after adding
# a few product photos only touches the new files. Existence rather than mtime
# decides that, because a fresh clone stamps every file with its checkout time
# and a source can easily look newer than the twin built from it.
#
# Usage:  bash scripts/convert-images.sh [root]
#         bash scripts/convert-images.sh --force   # rebuild every twin

set -euo pipefail

ROOT="frontend/public/images"
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    *) ROOT="$arg" ;;
  esac
done

command -v ffmpeg >/dev/null 2>&1 || {
  echo "ffmpeg not found. Install it, or run the conversion wherever ffmpeg lives." >&2
  exit 1
}

[ -d "$ROOT" ] || { echo "No such directory: $ROOT" >&2; exit 1; }

made=0 skipped=0 failed=0

while IFS= read -r src; do
  webp="${src%.*}.webp"

  if [ "$FORCE" -eq 0 ] && [ -f "$webp" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  # PNGs here are logos and flat artwork: lossy compression frays the edges and
  # dirties the alpha, and lossless WebP still beats the PNG it replaces.
  # Photographs go through the lossy encoder at the quality the existing twins
  # were built with.
  case "${src,,}" in
    *.png) args=(-lossless 1) ;;
    *)     args=(-quality 80) ;;
  esac

  if ffmpeg -hide_banner -loglevel error -i "$src" "${args[@]}" "$webp" -y 2>/dev/null; then
    made=$((made + 1))
    printf '  %s\n' "$webp"
  else
    failed=$((failed + 1))
    printf '  FAILED %s\n' "$src" >&2
    rm -f "$webp"
  fi
done < <(find "$ROOT" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) | sort)

echo "converted $made, already current $skipped, failed $failed"
[ "$failed" -eq 0 ]
