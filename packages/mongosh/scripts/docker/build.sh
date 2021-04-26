#!/usr/bin/env bash

set -e
cd "$(dirname "$0")"

if [ x"$ARTIFACT_URL" = x"" ]; then
  SHA=`git rev-parse origin/master`
  VERSION=`git show ${SHA}:lerna.json | grep version | cut -d ":" -f 2 | cut -d '"' -f 2`
  if echo "$1" | grep -q -- deb.Dockerfile; then
    ARTIFACT_URL="https://s3.amazonaws.com/mciuploads/mongosh/${SHA}/mongosh_${VESRION}_amd64.deb"
  else
    ARTIFACT_URL="https://s3.amazonaws.com/mciuploads/mongosh/${SHA}/mongosh-${VERSION}-x86_64.rpm"
  fi
fi

docker build --build-arg artifact_url="$ARTIFACT_URL" -t mongosh-$1 -f $1.Dockerfile .
