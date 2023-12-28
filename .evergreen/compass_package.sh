#! /usr/bin/env bash

set -e

echo "WINDOWS_SIGNING_SERVER_HOSTNAME: ${WINDOWS_SIGNING_SERVER_HOSTNAME}"
echo "WINDOWS_SIGNING_SERVER_PRIVATE_KEY: ${WINDOWS_SIGNING_SERVER_PRIVATE_KEY}"
echo "WINDOWS_SIGNING_SERVER_USERNAME: ${WINDOWS_SIGNING_SERVER_USERNAME}"
echo "WINDOWS_SIGNING_SERVER_PORT: ${WINDOWS_SIGNING_SERVER_PORT}"

if [[ "$OSTYPE" == "cygwin" ]]; then
  echo "Starting Installer Service..."
  net start MSIServer
fi

echo "Creating signed release build..."
npm run package-compass $COMPASS_DISTRIBUTION;

ls -la packages/compass/dist
