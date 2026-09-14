# Debian bullseye has reached EOL and its repos are expired, so `apt-get` fails;
# bookworm is the supported replacement.
ARG NODE_JS_VERSION=22
FROM node:${NODE_JS_VERSION}-bookworm

COPY .evergreen/connectivity-tests/krb5.conf /etc/krb5.conf

RUN apt-get update -y && \
    apt-get install -y \
    krb5-user \
    libsasl2-modules-gssapi-mit \
    ldap-utils \
    libkrb5-dev \
    libsecret-1-dev \
    net-tools \
    libstdc++6 \
    gnome-keyring

ENV COMPASS_RUN_DOCKER_TESTS="true"

COPY . /compass-monorepo-root
WORKDIR /compass-monorepo-root

RUN npm i -g npm@11.16.0
RUN npm run bootstrap-ci

CMD ["bash", ".evergreen/connectivity-tests/entrypoint.sh"]
