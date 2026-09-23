#! /usr/bin/env bash

set -e

source .evergreen/set-platform-env.sh

export BASHPATH="$PATH"
export OSTYPE="$OSTYPE"

escapeLeadingZero() {
    echo "$1" | sed 's/^0*//'
}

if [[ "${EVERGREEN_PROJECT}" == "10gen-compass-main" ]]; then
    # We do not publish anything from the 10gen-compass-main project.
    export npm_config_dry_run=true 
    # When packaging Compass from main, we want to use the dev version identifier
    # based on the created_at (when evergreen was triggered - formatted as 24_05_16_14_52_37).
    if [[ "${EVERGREEN_BRANCH_NAME}" == "main" ]]; then
        ts=($(echo "$EVERGREEN_CREATED_AT" | tr "_" " "))
        # The major.minor.patch components are numeric semver fields, so they
        # must not carry leading zeros.
        year=$(escapeLeadingZero "${ts[0]}")
        month=$(escapeLeadingZero "${ts[1]}")
        day=$(escapeLeadingZero "${ts[2]}")
        # 10# forces base 10, otherwise "08" and "09" are read as octal.
        # Convert the time portion of the timestamp into a single number of seconds
        # so that the resulting dev version identifier sorts chronologically as an opaque string.
        secondsOfDay=$(( 10#${ts[3]} * 3600 + 10#${ts[4]} * 60 + 10#${ts[5]} ))
        export DEV_VERSION_IDENTIFIER="${year}.${month}.${day}-dev.$(( 100000 + secondsOfDay ))"
    fi
fi

# We cannot rely on node from the PATH, as the script we're calling is setting up that PATH.
if [ -n "$IS_WINDOWS" ]; then
  .deps/node.exe .evergreen/print-compass-env.js
else
  .deps/bin/node .evergreen/print-compass-env.js
fi