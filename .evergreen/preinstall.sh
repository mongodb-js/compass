#!/usr/bin/env bash

set -e

echo "========================="
echo "Important Environment Variables"
echo "========================="
echo "PLATFORM: $PLATFORM"
echo "ARCH: $ARCH"
echo "NODE_JS_VERSION: $NODE_JS_VERSION"
echo "NPM_VERSION: $NPM_VERSION"
echo "APPDATA: $APPDATA"
echo "PATH: $PATH"

echo "IS_OSX: $IS_OSX"
echo "IS_LINUX: $IS_LINUX"
echo "IS_WINDOWS: $IS_WINDOWS"
echo "IS_RHEL: $IS_RHEL"
echo "IS_UBUNTU: $IS_UBUNTU"

echo "DOCKER_CONFIG: $DOCKER_CONFIG"

SCRIPTDIR="$(cd $(dirname "$0"); pwd)"

if [ -n "$IS_WINDOWS" ]; then
    echo "Installing nodejs v$NODE_JS_VERSION for windows..."
    bash "${SCRIPTDIR}/retry-with-backoff.sh" curl -fs \
    -o ".deps/node-v$NODE_JS_VERSION-win-$ARCH.zip" \
    --url "https://nodejs.org/download/release/v$NODE_JS_VERSION/node-v$NODE_JS_VERSION-win-$ARCH.zip"
    cd .deps
    ls -alh
    unzip -q node-v$NODE_JS_VERSION-win-$ARCH.zip
    mv node-v$NODE_JS_VERSION-win-$ARCH/* .
    rm -rf node-v$NODE_JS_VERSION-win-$ARCH

    echo "Installing npm@$NPM_VERSION..."
    rm -rf npm npx npm.cmd npx.cmd
    mv node_modules/npm node_modules/npm2
    chmod +x ./node.exe

    ./node.exe node_modules/npm2/bin/npm-cli.js i -g npm@$NPM_VERSION
    rm -rf node_modules/npm2/
    chmod +x npm.cmd npm
else
    if command -v ldd &> /dev/null && `ldd $(which bash) | grep 'libc.so' | awk '{print $3}'` | grep -Eq 'release version 2.(1|2[0-7])'; then
        echo "Installing unofficial nodejs compiled for glibc 2.17 v${NODE_JS_VERSION} for ${PLATFORM} on ${ARCH}..."

        bash "${SCRIPTDIR}/retry-with-backoff.sh" curl -fs \
            -o ".deps/node-v${NODE_JS_VERSION}-${PLATFORM}-$ARCH.tar.gz" \
            --url "https://unofficial-builds.nodejs.org/download/release/v${NODE_JS_VERSION}/node-v${NODE_JS_VERSION}-${PLATFORM}-$ARCH-glibc-217.tar.gz"
    else
        echo "Installing nodejs v${NODE_JS_VERSION} for ${PLATFORM} on ${ARCH}..."

        bash "${SCRIPTDIR}/retry-with-backoff.sh" curl -fs \
            -o ".deps/node-v${NODE_JS_VERSION}-${PLATFORM}-$ARCH.tar.gz" \
            --url "https://nodejs.org/download/release/v${NODE_JS_VERSION}/node-v${NODE_JS_VERSION}-${PLATFORM}-$ARCH.tar.gz"
    fi

    cd .deps
    tar xzf node-v$NODE_JS_VERSION-$PLATFORM-$ARCH.tar.gz --strip-components=1

    echo "Installing latest npm..."
    rm -rf npm npx
    mv lib/node_modules/npm lib/node_modules/npm2

    chmod +x ./bin/node

    ./bin/node lib/node_modules/npm2/bin/npm-cli.js version

    ./bin/node lib/node_modules/npm2/bin/npm-cli.js i -g npm@$NPM_VERSION
    rm -rf lib/node_modules/npm2/
fi
