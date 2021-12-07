#! /usr/bin/env bash

# This is running in a new shell after ssh, so we have to load the env vars again
set -e
source ./env-vars.sh
eval $(node .evergreen/print-compass-env.js)

# We do print the environment during the build process in a few places
# but we probably should stop doing that. After that, we can go back
# to using plain APPLE_USERNAME and APPLE_PASSWORD environment variables.
echo $APPLE_CREDENTIALS > /tmp/compass-apple-cred.json
export APPLE_CREDENTIALS_FILE="/tmp/compass-apple-cred.json"

.evergreen/compass_package.sh

rm -f /tmp/compass-apple-cred.json