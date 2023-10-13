#!/bin/bash

declare ATLAS_URL
declare PLATFORM
declare ARCH

ATLAS_VERSION=1.12.1
TMP_PATH=../tmp
ATLAS_CLI="${TMP_PATH}/atlas/bin/atlas"

setup_environment() {
    if [[ $(uname) == Darwin ]]; then
        PLATFORM='macos'
        if [[ $(uname -m) == x86_64 ]]; then
            ARCH=x86_64
        else
            ARCH=arm64
        fi
        ATLAS_URL="https://fastdl.mongodb.org/mongocli/mongodb-atlas-cli_${ATLAS_VERSION}_${PLATFORM}_${ARCH}.zip"
    fi
}

is_local_atlas_supported() {
    if [[ $PLATFORM == macos && ($ARCH == x86_64 || $ARCH == arm64) ]]; then
        return 0
    else
        return 1
    fi
}

setup_atlascli() {
    echo "Downloading atlascli for $PLATFORM-$ARCH from $ATLAS_URL"

    mkdir -p "$TMP_PATH"
    curl -o "${TMP_PATH}/atlas.zip" "$ATLAS_URL"
    unzip -q -o "${TMP_PATH}/atlas.zip" -d "${TMP_PATH}/atlas"

    chmod +x "$ATLAS_CLI"
    echo "Atlas CLI installed"
    echo "$($ATLAS_CLI --version)"

    rm "${TMP_PATH}/atlas.zip"
}

teardown_atlascli() {
    rm -rf "${TMP_PATH}/atlas"
}

usage() {
    echo "Usage:"
    echo "  $0 setup [PORT] [NAME]"
    echo "  $0 teardown [NAME]"
    exit 1
}

if [ $# -eq 0 ]; then
    usage
fi

if [ "$1" == "setup" ]; then
    if [ -z "$2" ] || [ -z "$3" ]; then
        usage
    fi

    setup_environment
    if ! is_local_atlas_supported; then
        echo "Skipping atlascli setup for: $PLATFORM-$ARCH"
        exit 1
    fi

    setup_atlascli

    PORT=$2
    NAME=$3

    echo "Setting up a local deployment $NAME on port $PORT"
    "$ATLAS_CLI" deployments setup "$NAME" --force --type LOCAL --port "$PORT"
    exit 0
fi

if [ "$1" == "teardown" ]; then
    if [ -z "$2" ]; then
        usage
    fi

    if [[ $(uname) == "Darwin" ]]; then
        NAME=$2
        echo "Tearing down a local deployment $NAME"
        "$ATLAS_CLI" deployments delete "$NAME" --force
        teardown_atlascli
        exit 0
    else
        echo "Skipping atlascli teardown for: $(uname)"
        exit 1
    fi
fi

usage