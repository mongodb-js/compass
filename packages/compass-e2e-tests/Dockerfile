# This Dockerfile builds and image that allows you to run compass e2e tests
# in a docker container without the need to do all the extra setup
#
# Usage:
#
#   # build the image first, by default compass repo will by pulled from remote
#   docker build \
#     --platform=linux/amd64 \
#     -f ./packages/compass-e2e-tests/Dockerfile .
#
#   # you can build from a specific compass repo revision
#   docker build \
#     --platform=linux/amd64 \
#     --build-arg="COMPASS_VERSION=#v1.45.0" \
#     -f ./packages/compass-e2e-tests/Dockerfile .
#
#   # you can also build from local
#   docker build \
#     --platform=linux/amd64 \
#     --build-arg="COMPASS_REPO=./" \
#     -f ./packages/compass-e2e-tests/Dockerfile .
#
#   # run all web tests (default command)
#   docker run --rm -it <image id>
#
#   # run with a custom command (this runs filtered tests for desktop)
#   docker run --rm -it <image id> desktop --test-filter=time-to-first-query
#
#   # e2e env configuration is also supported (this runs filtered web tests)
#   docker run -e COMPASS_E2E_TEST_FILTER="time-to-first-query" --rm -it <image id>

FROM ubuntu:20.04
USER root

ARG NVM_VERSION="0.40.1"
ARG NODE_VERSION="20.16.0"
ENV NODE_VERSION=${NODE_VERSION}
ARG NPM_VERSION="10.2.4"
ENV NPM_VERSION=${NPM_VERSION}
# By default will pull compass from git, can be overriden with a local path
ARG COMPASS_REPO="https://github.com/mongodb-js/compass.git"
# When COMPASS_REPO points to the git repository, can be used to fetch repo with
# a certain tag / branch. Should start with #: `#v1.42.0`
ARG COMPASS_VERSION=""

WORKDIR /tmp/compass

ADD ${COMPASS_REPO}${COMPASS_VERSION} .
ADD https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh install_nvm.sh

ENV DEBIAN_FRONTEND=noninteractive
# Default address, this will become available before we start running tests
ENV DBUS_SESSION_BUS_ADDRESS=unix:path=/var/run/dbus/system_bus_socket
# Required by some compass deps
ENV CXX=gcc-11

RUN <<EOF
# Add toolchain repo
apt-get update
apt-get install -y software-properties-common
add-apt-repository -y ppa:ubuntu-toolchain-r/test
# Update again so we can install build deps
apt-get update
apt-get upgrade -y
# Now finally install the deps (build and electron / chromium runtime)
bash .evergreen/retry-with-backoff.sh apt-get install -y \
  xvfb curl python3 build-essential libkrb5-dev libsecret-1-dev gcc-11 g++-11 \
  xorg dbus-x11 libgtk-3-0 libnss3-dev libxss-dev libgbm-dev libasound2
EOF

ENV NVM_DIR=/root/.nvm
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN <<EOF
# Install node, npm
bash install_nvm.sh
. "${NVM_DIR}/nvm.sh"
nvm install ${NODE_VERSION}
npm i -g npm@${NPM_VERSION}
node --version
npm --version
# Install monorepo deps and bootstrap compass-e2e-tests package
bash .evergreen/retry-with-backoff.sh .evergreen/npm_ci.sh
npx lerna run bootstrap --scope compass-e2e-tests --include-dependencies
# Prepare entrypoint file
echo "#! /usr/bin/env bash\n" \
  "set -e\n" \
  "service dbus start\n" \
  "npm run -w compass-e2e-tests test -- \$@" >./entrypoint.sh
chmod +x ./entrypoint.sh
EOF

ENV DEBUG="compass-e2e-tests*,electron*,hadron*,mongo*"
ENV MONGODB_VERSION="8.0.x-enterprise"
ENV MONGODB_RUNNER_VERSION="8.0.x-enterprise"
ENV COMPASS_E2E_WEBDRIVER_WAITFOR_TIMEOUT="240000"
ENV COMPASS_E2E_WEBDRIVER_WAITFOR_INTERVAL="1000"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["web"]
