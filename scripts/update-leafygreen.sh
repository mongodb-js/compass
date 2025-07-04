#!/bin/bash

# Path to compass-components package.json
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_JSON="$SCRIPT_DIR/../packages/compass-components/package.json"

# Use jq to get all @leafygreen-ui/* dependencies (prod + dev)
packages=$(jq -r '
  .dependencies, .devDependencies
  | to_entries[]
  | select(.key | startswith("@leafygreen-ui/"))
  | .key
' "$PKG_JSON")

# For each package, get the latest version and update package.json
for pkg in $packages; do
  latest=$(npm view "$pkg" version 2>/dev/null)
  if [ -n "$latest" ]; then
    echo "Updating $pkg to $latest"
    # Use jq to update both dependencies and devDependencies
    tmp=$(mktemp)
    jq --arg pkg "$pkg" --arg ver "^$latest" '
      if .dependencies[$pkg] then .dependencies[$pkg] = $ver else . end
      | if .devDependencies[$pkg] then .devDependencies[$pkg] = $ver else . end
    ' "$PKG_JSON" > "$tmp" && mv "$tmp" "$PKG_JSON"
  else
    echo "Could not find $pkg on npm"
  fi
done

echo "Done! Updated $PKG_JSON"