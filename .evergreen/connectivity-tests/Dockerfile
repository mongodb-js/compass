# "bullseye" is the debian distribution that
# ubuntu:20.04 is based on, this should allow
# us to "mount" also node_modules without needing to
# reinstall / rebootstrap
FROM node:14-bullseye

COPY krb5.conf /etc/krb5.conf

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

COPY entrypoint.sh /entrypoint.sh

WORKDIR /compass-monorepo-root

CMD ["bash", "/entrypoint.sh"]




