FROM ubuntu:20.04

ARG commit=""
ARG version=""
ADD https://s3.amazonaws.com/mciuploads/mongosh/${commit}/mongosh-${version}-linux.tgz /tmp
RUN tar zxvf /tmp/mongosh-${version}-linux.tgz && \
  mv mongosh /usr/bin/mongosh

ENTRYPOINT [ "mongosh" ]
