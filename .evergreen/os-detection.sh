#!/bin/sh

# node stuff
export ARTIFACTS_PATH="$(pwd)/.deps"
export NPM_CACHE_DIR="$(pwd)/.deps/.npm"
export NPM_TMP_DIR="$(pwd)/.deps/tmp"

export NODE_JS_VERSION="8.9.3"

# OS detection
if [ -n "$OSTYPE" ]; then
if [ "$OSTYPE" == "msys" ]; then
    export PLATFORM='win32'
    export IS_WINDOWS=true
    IS_WINDOWS=true
elif [ "$OSTYPE" == "cygwin" ]; then
    export PLATFORM='win32'
    export IS_WINDOWS=true
fi
elif [ `uname` == "Darwin" ]; then
    export PLATFORM='darwin'
    export IS_OSX=true
else
    export PLATFORM='linux'
    export IS_LINUX=true
    if cat /etc/*release | grep ^NAME | grep Red; then
        export IS_RHEL=true
    elif cat /etc/*release | grep ^NAME | grep Ubuntu; then
        export IS_UBUNTU=true
    fi
fi

if [ -n "$IS_WINDOWS" ]; then
export PATH="$(pwd)/.deps:$PATH"
export APPDATA=Z:\
else
export PATH="$(pwd)/.deps/bin:$PATH"
fi