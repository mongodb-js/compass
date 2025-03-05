# This Dockerfile builds and image that allows you to run compass e2e tests
# with just one command without the need to do all the extra setup. All
# compass-e2e-tests flags are supported. By default the image will try to run
# all web tests. This can be overriden by specifying your own command.

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
ENV DBUS_SESSION_BUS_ADDRESS=unix:path=/var/run/dbus/system_bus_socket

RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository -y ppa:ubuntu-toolchain-r/test
RUN apt-get update
RUN apt-get upgrade -y
# build deps
RUN bash .evergreen/retry-with-backoff.sh apt-get install -y \
  xvfb curl python3 build-essential libkrb5-dev libsecret-1-dev gcc-11 g++-11
# electron runtime deps
RUN bash .evergreen/retry-with-backoff.sh apt-get install -y \
  xorg dbus-x11 libgtk-3-0 libnss3-dev libxss-dev libgbm-dev libasound2

# required by some compass deps
ENV CXX=gcc-11

ENV NVM_DIR=/root/.nvm
RUN bash install_nvm.sh
RUN . "${NVM_DIR}/nvm.sh" && nvm install ${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN npm i -g npm@${NPM_VERSION}
RUN node --version
RUN npm --version

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN bash .evergreen/retry-with-backoff.sh .evergreen/npm_ci.sh
RUN npx lerna run bootstrap --scope compass-e2e-tests --include-dependencies

# check that all electron deps are installed correctly
RUN xvfb-run npx electron --no-sandbox --version

ENV DEBUG="compass-e2e-tests*,electron*,hadron*,mongo*"
ENV MONGODB_VERSION="8.0.x-enterprise"
ENV MONGODB_RUNNER_VERSION="8.0.x-enterprise"
ENV COMPASS_E2E_WEBDRIVER_WAITFOR_TIMEOUT="240000"
ENV COMPASS_E2E_WEBDRIVER_WAITFOR_INTERVAL="1000"

ENTRYPOINT ["service", "dbus", "start", "&&", "npm", "run", "-w", "compass-e2e-tests", "test", "--"]
CMD ["web"]
