#!/usr/bin/env bash
set -e

cd $(pwd)

source .evergreen/.setup_env
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
if [ "$(uname)" == Linux ]; then
  mkdir -p tmp
  cp "$(pwd)/../tmp/expansions.yaml" tmp/expansions.yaml
  (cd scripts/docker && docker build -t centos7-build -f centos7-build.Dockerfile .)
  echo Starting Docker container build
  docker run -e PUPPETEER_SKIP_CHROMIUM_DOWNLOAD \
    -e EVERGREEN_EXPANSIONS_PATH=/tmp/build/tmp/expansions.yaml \
    -e NODE_JS_VERSION \
    -e DISTRIBUTION_BUILD_VARIANT \
    --rm -v $PWD:/tmp/build --network host centos7-build \
    -c 'source /opt/rh/devtoolset-8/enable && cd /tmp/build && npm run evergreen-release compile && dist/mongosh --version'
else
  npm run evergreen-release compile
fi
dist/mongosh --version

tar cvzf dist.tgz dist
