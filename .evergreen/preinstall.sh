set -ev
export NODE_JS_VERSION="8.9.3"

# OS detection
if [ `uname` == "Darwin" ]; then
    PLATFORM='darwin'
    IS_OSX=true
elif [ "$OSTYPE" == "msys" ]; then
    PLATFORM='win32'
    IS_WINDOWS=true
elif [ "$OSTYPE" == "cygwin" ]; then
    PLATFORM='win32'
    IS_WINDOWS=trues
else
    PLATFORM='linux'
    IS_LINUX=true
    if cat /etc/*release | grep ^NAME | grep Red; then
        IS_RHEL=true
    elif cat /etc/*release | grep ^NAME | grep Ubuntu; then
        IS_UBUNTU=true
    fi
fi

echo "NODE_JS_VERSION: $NODE_JS_VERSION"
echo "NODE_JS_VERSION: ${NODE_JS_VERSION}"
echo "PLATFORM: $PLATFORM"
echo "PLATFORM: ${PLATFORM}"

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