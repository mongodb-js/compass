#!/usr/bin/env bash
set -euo pipefail

# go to the drawer-layout folder in this repo
cd "$(dirname "$0")/packages/compass-components/src/components/toolbar/utils" || {
  echo "ERROR: cannot cd into drawer-layout folder"
  exit 1
}
for f in *; do
  # fallback for plain awk / BSD sed
    new=$(echo "$f" \
      | sed -E 's/([A-Z]+)([A-Z][a-z])/\1-\2/g; s/([a-z0-9])([A-Z])/\1-\2/g' \
      | tr '[:upper:]' '[:lower:]')
	 # show what would be moved
  echo "→ $f  →  $new"

  if [[ "$f" != "$new" ]]; then
    mv -v -- "$f" "$new"
  fi
done