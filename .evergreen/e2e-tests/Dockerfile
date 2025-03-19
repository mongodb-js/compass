# "bullseye" is the debian distribution that ubuntu:20.04 is based on
ARG NODE_JS_VERSION=20
FROM node:${NODE_JS_VERSION}-bullseye

COPY . /compass-monorepo-root
WORKDIR /compass-monorepo-root

RUN npm i -g npm@10.2.4
RUN npm run bootstrap-ci

CMD ["npm run test-web"]