# "bullseye" is the debian distribution that
# ubuntu:20.04 is based on
FROM node:14-bullseye

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

RUN npm i -g npm@8
RUN npm run bootstrap-ci

CMD ["bash", ".evergreen/connectivity-tests/entrypoint.sh"]
