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
        year=$(escapeLeadingZero "${ts[0]}")
        month=$(escapeLeadingZero "${ts[1]}")
        day=$(escapeLeadingZero "${ts[2]}")
        hour=$(escapeLeadingZero "${ts[3]}")
        minute=$(escapeLeadingZero "${ts[4]}")
        second=$(escapeLeadingZero "${ts[5]}")
        export DEV_VERSION_IDENTIFIER="${year}.${month}.${day}-dev.${hour}${minute}${second}"
    fi
fi


.evergreen/print-compass-env.js
