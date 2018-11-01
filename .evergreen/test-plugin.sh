#! /usr/bin/env bash

if [ $# -lt 1 ]; then
    echo "usage: test-plugin.sh <github-repo>"
    exit 1
fi 

source ~/compass_env.sh


GIT_URI="git@github.com:${1}.git"
git clone $GIT_URI ./plugin;

cd ./plugin;

echo "Configuring npm..."
cat <<EOT > .npmrc
devdir=$NPM_CACHE_DIR/.node-gyp
init-module=$NPM_CACHE_DIR/.npm-init.js
cache=$NPM_CACHE_DIR
tmp=$NPM_TMP_DIR
_authToken=$NPM_AUTH_TOKEN
EOT

cat .npmrc
npm install
npm test
