#!/bin/sh
set -x
set -e
# just to make sure: we are in the mongosh root dir
test -x packages && grep -q '"name": "mongosh"' package.json
# we pick a target directory that is not affected by the mongosh node_modules directory
mongosh_root_dir=$PWD
test_root_dir=/tmp/mongosh-vscode-test
export SEGMENT_KEY=GtEn04CBjn39g6A0BxldDf81YGFONOz7 # fresh from /dev/urandom
rm -rf "$test_root_dir" && mkdir -p "$test_root_dir"
cd "$test_root_dir"
git clone --depth=10 https://github.com/mongodb-js/vscode.git
cd vscode
npm install
rm -rf node_modules/@mongosh
(cd node_modules && ln -s "$mongosh_root_dir/packages" @mongosh)
npm test
cd /tmp
rm -rf "$test_root_dir"
