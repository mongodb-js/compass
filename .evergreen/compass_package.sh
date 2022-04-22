#! /usr/bin/env bash
if [[ "$OSTYPE" == "cygwin" ]]; then
  echo "Starting Installer Service..."
  net start MSIServer
fi

echo "Creating signed release build..."
npm run package-compass $COMPASS_DISTRIBUTION;

ls -la packages/compass/dist
