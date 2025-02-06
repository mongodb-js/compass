#! /usr/bin/env bash

set -e

if [[ $OSTYPE == "cygwin" ]]; then
    export PLATFORM='win32'
    export IS_WINDOWS=true
    export ARCH=x64
elif [[ $(uname) == Darwin ]]; then
    export PLATFORM='darwin'
    export IS_OSX=true
    if [ `uname -m` = x86_64 ]; then
        export ARCH=x64
    else
        export ARCH=arm64
    fi
else
    export PLATFORM='linux'
    export IS_LINUX=true
    export ARCH=x64
    if [[ $(cat /etc/*release | grep ^NAME | grep Red) ]]; then
        export IS_RHEL=true
    elif [[ $(cat /etc/*release | grep ^NAME | grep Ubuntu) ]]; then
        export IS_UBUNTU=true
    fi
fi

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
        minute="${ts[4]}"
        second="${ts[5]}"
        export DEV_VERSION_IDENTIFIER="${year}.${month}.${day}-dev.${hour}${minute}${second}"
    fi
fi


.evergreen/print-compass-env.js
