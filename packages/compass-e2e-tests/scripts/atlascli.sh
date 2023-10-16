#!/bin/bash

declare ATLAS_URL
declare PODMAN_URL
declare PLATFORM
declare ARCH

ATLAS_VERSION=1.12.1
PODMAN_VERSION=4.7.1
TMP_PATH=../tmp

setup_environment() {
    if [[ $(uname) == Darwin ]]; then
        PLATFORM='macos'
        if [[ $(uname -m) == x86_64 ]]; then
            ARCH=x86_64
        else
            ARCH=arm64
        fi
        ATLAS_URL="https://fastdl.mongodb.org/mongocli/mongodb-atlas-cli_${ATLAS_VERSION}_${PLATFORM}_${ARCH}.zip"
        
        PODMAN_ARCH=[[ $ARCH = 'arm64' ]] && 'arm64' || 'amd64'
        PODMAN_URL="https://github.com/containers/podman/releases/download/v${PODMAN_VERSION}/podman-remote-release-darwin_${PODMAN_ARCH}.zip"
    fi
}

is_local_atlas_supported() {
    if [[ $PLATFORM == macos && ($ARCH == x86_64 || $ARCH == arm64) ]]; then
        return 0
    else
        return 1
    fi
}

setup_podman() {
    if ! command -v podman &> /dev/null; then
        echo "Downloading podman for $PLATFORM-$ARCH from $PODMAN_URL"
        mkdir -p "$TMP_PATH"
        curl -o "${TMP_PATH}/podman.zip" "$PODMAN_URL"
        unzip -q -o "${TMP_PATH}/podman.zip" -d "${TMP_PATH}/podman"
        rm "${TMP_PATH}/podman.zip"
        export PATH=$PATH:"${TMP_PATH}/podman/usr/bin"
    fi
    echo "Podman installed"
    echo "podman --version"
}

setup_atlascli() {
    if ! command -v atlas &> /dev/null; then
        echo "Downloading atlascli for $PLATFORM-$ARCH from $ATLAS_URL"
        mkdir -p "$TMP_PATH"
        curl -o "${TMP_PATH}/atlas.zip" "$ATLAS_URL"
        unzip -q -o "${TMP_PATH}/atlas.zip" -d "${TMP_PATH}/atlas"
        rm "${TMP_PATH}/atlas.zip"
        export PATH=$PATH:"${TMP_PATH}/atlas/bin"
    fi
    echo "Atlas installed"
    echo "atlas --version"
}

teardown() {
    rm -rf "${TMP_PATH}/atlas"
    rm -rf "${TMP_PATH}/podman"
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

    setup_podman
    setup_atlascli

    PORT=$2
    NAME=$3

    echo "Setting up a local deployment $NAME on port $PORT"
    atlas deployments setup "$NAME" --force --type LOCAL --port "$PORT"
    exit 0
fi

if [ "$1" == "teardown" ]; then
    if [ -z "$2" ]; then
        usage
    fi

    if [[ $(uname) == "Darwin" ]]; then
        NAME=$2
        echo "Tearing down a local deployment $NAME"
        atlas deployments delete "$NAME" --force
        teardown
        exit 0
    else
        echo "Skipping atlascli teardown for: $(uname)"
        exit 1
    fi
fi

usage