#!/usr/bin/env bash

set -e

echo "========================="
echo "Important Environment Variables"
echo "========================="
echo "PLATFORM: $PLATFORM"
echo "ARCH: $ARCH"
echo "ELECTRON_VERSION: $ELECTRON_VERSION"
echo "NODE_JS_VERSION: $NODE_JS_VERSION"
echo "NPM_VERSION: $NPM_VERSION"
echo "APPDATA: $APPDATA"
echo "PATH: $PATH"

echo "IS_OSX: $IS_OSX"
echo "IS_LINUX: $IS_LINUX"
echo "IS_WINDOWS: $IS_WINDOWS"
echo "IS_RHEL: $IS_RHEL"
echo "IS_UBUNTU: $IS_UBUNTU"

SCRIPTDIR="$(cd $(dirname "$0"); pwd)"

if [ -n "$IS_WINDOWS" ]; then
    # TODO: switch to ELECTRON_RUN_AS_NODE=1 for windows too

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

    cd ..
    .evergreen/node-gyp-bug-workaround.sh
else
    echo "Installing electron v${ELECTRON_VERSION} for ${PLATFORM} on ${ARCH} to be used as node..."

    bash "${SCRIPTDIR}/retry-with-backoff.sh" curl -fsL \
        -o ".deps/electron-v${ELECTRON_VERSION}-${PLATFORM}-$ARCH.zip" \
        --url "https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-${PLATFORM}-${ARCH}.zip"

    cd .deps
    unzip -q electron-v${ELECTRON_VERSION}-${PLATFORM}-${ARCH}.zip
    ls -alh
    mkdir bin
    cp ../.evergreen/node.sh bin/node

    echo "Installing npm v${NPM_VERSION}..."

    curl -qL https://www.npmjs.com/install.sh | sh
    echo "got npm version:"
    npm -v
    npm i -g npm@${NPM_VERSION}
fi
