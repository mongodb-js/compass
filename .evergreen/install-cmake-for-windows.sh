#!/usr/bin/env bash

set -e

SCRIPTDIR="$(cd $(dirname "$0"); pwd)"
CMAKE_VERSION="3.30.3"
FILE_NAME="cmake-$CMAKE_VERSION-windows-x86_64"

echo "Installing cmake $CMAKE_VERSION for windows..."

bash "${SCRIPTDIR}/retry-with-backoff.sh" curl -LsS \
    -o ".deps/$FILE_NAME.zip" \
    --url "https://github.com/Kitware/CMake/releases/download/v$CMAKE_VERSION/$FILE_NAME.zip"

cd .deps
ls -alh
unzip -q "$FILE_NAME.zip"
rm -rf $FILE_NAME.zip

chmod +x $FILE_NAME/bin/*

PATH=$PWD/$FILE_NAME/bin:$PATH
export PATH
which cmake
cmake --version
