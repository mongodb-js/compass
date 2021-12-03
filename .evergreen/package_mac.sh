#! /usr/bin/env bash

# We do print the environment during the build process in a few places
# but we probably should stop doing that. After that, we can go back
# to using plain APPLE_USERNAME and APPLE_PASSWORD environment variables.
echo $APPLE_CREDENTIALS > /tmp/compass-apple-cred.json
export APPLE_CREDENTIALS_FILE="/tmp/compass-apple-cred.json"

.evergreen/compass_package.sh

rm -f /tmp/compass-apple-cred.json