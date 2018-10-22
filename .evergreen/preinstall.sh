#!/bin/sh

if [[ $OSTYPE == "cygwin" ]]; then
    export PLATFORM='win32'
    export IS_WINDOWS=true
elif [[ `uname` == Darwin ]]; then
    export PLATFORM='darwin'
    export IS_OSX=true
else
    export PLATFORM='linux'
    export IS_LINUX=true
    if [[ `cat /etc/*release | grep ^NAME | grep Red` ]]; then
        export IS_RHEL=true
    elif [[ `cat /etc/*release | grep ^NAME | grep Ubuntu` ]]; then
        export IS_UBUNTU=true
    fi
fi

echo "========================="
echo "Important Environment Variables"
echo "========================="
echo "PLATFORM: $PLATFORM"
echo "NODE_JS_VERSION: $NODE_JS_VERSION"
echo "APPDATA: $APPDATA"
echo "PATH: $PATH"

echo "PLATFORM: $PLATFORM"
echo "IS_OSX: $IS_OSX"
echo "IS_LINUX: $IS_LINUX"
echo "IS_WINDOWS: $IS_WINDOWS"
echo "IS_RHEL: $IS_RHEL"
echo "IS_UBUNTU: $IS_UBUNTU"


if [ -n "$IS_WINDOWS" ]; then
    echo "Installing nodejs v$NODE_JS_VERSION for windows..."
    curl -fs \
    -o ".deps/node-v$NODE_JS_VERSION-win-x64.zip" \
    --url "https://nodejs.org/download/release/v$NODE_JS_VERSION/node-v$NODE_JS_VERSION-win-x64.zip"
    cd .deps
    ls -alh
    unzip -q node-v$NODE_JS_VERSION-win-x64.zip
    mv node-v$NODE_JS_VERSION-win-x64/* .
    rm -rf node-v$NODE_JS_VERSION-win-x64

    echo "Installing latest npm..."
    rm -rf npm npx npm.cmd npx.cmd
    mv node_modules/npm node_modules/npm2
    chmod +x ./node.exe
    ./node.exe node_modules/npm2/bin/npm-cli.js i -g npm@latest
    rm -rf node_modules/npm2/
    chmod +x npm.cmd npm
else
    echo "Installing nodejs v${NODE_JS_VERSION} for ${PLATFORM}..."
    curl -fs \
        -o ".deps/node-v${NODE_JS_VERSION}-${PLATFORM}-x64.tar.gz" \
        --url "https://nodejs.org/download/release/v${NODE_JS_VERSION}/node-v${NODE_JS_VERSION}-${PLATFORM}-x64.tar.gz"
    cd .deps
    tar xzf node-v$NODE_JS_VERSION-$PLATFORM-x64.tar.gz --strip-components=1

    echo "Installing latest npm..."
    rm -rf npm npx
    mv lib/node_modules/npm lib/node_modules/npm2

    chmod +x ./bin/node
    ./bin/node lib/node_modules/npm2/bin/npm-cli.js i -g npm@latest
    rm -rf lib/node_modules/npm2/

    if [ -n "$IS_RHEL" ]; then
        echo "Installing native-addon depenendencies for RHEL..."
        #TODO (imlucas) Durran says these might be installed already by build team?
        yum localinstall -y http://mirror.centos.org/centos/7/os/x86_64/Packages/libsecret-0.18.5-2.el7.x86_64.rpm
        yum localinstall -y http://mirror.centos.org/centos/7/os/x86_64/Packages/libsecret-devel-0.18.5-2.el7.x86_64.rpm
    elif [ -n "$IS_UBUNTU" ]; then
        echo "Installing native-addon depenendencies for Ubuntu..."
        #TODO (imlucas) Durran says these might be installed already by build team?
        sudo apt-get install -y libsecret-1-dev
    fi
fi