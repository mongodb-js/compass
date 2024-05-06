#! /usr/bin/env bash
set -e
set -x

if [[ "$OSTYPE" == "cygwin" ]]; then
  echo "Starting Installer Service..."
  net start MSIServer
fi

# Ensure .sbom is always created with fresh data
rm -rvf .sbom && mkdir -pv .sbom

echo "Creating signed release build..."
npm run package-compass $COMPASS_DISTRIBUTION;

ls -la packages/compass/dist
