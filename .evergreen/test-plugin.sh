#! /usr/bin/env bash

if [ $# -lt 1 ]; then
    echo "usage: test-plugin.sh <github-repo>"
    exit 1
fi 

source ~/compass_env.sh

npm version

GIT_URI="git@github.com:${1}.git"
git clone $GIT_URI ./plugin;

cd ./plugin;

echo "Configuring npm..."
cat <<EOT > .npmrc
engine-strict=true
registry=https://registry.npmjs.org/
devdir=$NPM_CACHE_DIR/.node-gyp
init-module=$NPM_CACHE_DIR/.npm-init.js
cache=$NPM_CACHE_DIR
tmp=$NPM_TMP_DIR
_authToken=$NPM_AUTH_TOKEN
EOT

cat .npmrc
npm install
npm test -- --reporter xunit --reporter-options output=plugin-test-results.xml

ls -alh 

echo "Test results written to output=plugin-test-results.xml"
