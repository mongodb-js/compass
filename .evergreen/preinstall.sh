#!/usr/bin/env bash

set -e

echo "========================="
echo "Important Environment Variables"
echo "========================="
echo "PLATFORM: $PLATFORM"
echo "NODE_JS_VERSION: $NODE_JS_VERSION"
echo "NPM_VERSION: $NPM_VERSION"
echo "APPDATA: $APPDATA"
echo "PATH: $PATH"

echo "PLATFORM: $PLATFORM"
echo "IS_OSX: $IS_OSX"
echo "IS_LINUX: $IS_LINUX"
echo "IS_WINDOWS: $IS_WINDOWS"
echo "IS_RHEL: $IS_RHEL"
echo "IS_UBUNTU: $IS_UBUNTU"

SCRIPTDIR="$(cd $(dirname "$0"); pwd)"

if [ -n "$IS_WINDOWS" ]; then
    echo "Installing nodejs v$NODE_JS_VERSION for windows..."
    bash "${SCRIPTDIR}/retry-with-backoff.sh" curl -fs \
    -o ".deps/node-v$NODE_JS_VERSION-win-x64.zip" \
    --url "https://nodejs.org/download/release/v$NODE_JS_VERSION/node-v$NODE_JS_VERSION-win-x64.zip"
    cd .deps
    ls -alh
    unzip -q node-v$NODE_JS_VERSION-win-x64.zip
    mv node-v$NODE_JS_VERSION-win-x64/* .
    rm -rf node-v$NODE_JS_VERSION-win-x64

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
    echo "Installing nodejs v${NODE_JS_VERSION} for ${PLATFORM}..."

    bash "${SCRIPTDIR}/retry-with-backoff.sh" curl -fs \
        -o ".deps/node-v${NODE_JS_VERSION}-${PLATFORM}-x64.tar.gz" \
        --url "https://nodejs.org/download/release/v${NODE_JS_VERSION}/node-v${NODE_JS_VERSION}-${PLATFORM}-x64.tar.gz"
    cd .deps
    tar xzf node-v$NODE_JS_VERSION-$PLATFORM-x64.tar.gz --strip-components=1

    echo "Installing latest npm..."
    rm -rf npm npx
    mv lib/node_modules/npm lib/node_modules/npm2

    chmod +x ./bin/node

    ./bin/node lib/node_modules/npm2/bin/npm-cli.js version

    ./bin/node lib/node_modules/npm2/bin/npm-cli.js i -g npm@$NPM_VERSION
    rm -rf lib/node_modules/npm2/
fi
