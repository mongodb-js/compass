#! /usr/bin/env bash

set -e

if [[ $OSTYPE == "cygwin" ]]; then
    export PLATFORM='win32'
    export IS_WINDOWS=true
elif [[ $(uname) == Darwin ]]; then
    export PLATFORM='darwin'
    export IS_OSX=true
else
    export PLATFORM='linux'
    export IS_LINUX=true
    if [[ $(cat /etc/*release | grep ^NAME | grep Red) ]]; then
        export IS_RHEL=true
    elif [[ $(cat /etc/*release | grep ^NAME | grep Ubuntu) ]]; then
        export IS_UBUNTU=true
    fi
fi

export BASHPATH="$PATH"
export OSTYPE="$OSTYPE"

.evergreen/print-compass-env.js
