FROM ubuntu:16.04

ARG artifact_url=""
ADD ${artifact_url} /tmp
RUN apt-get update
RUN apt-get install -y /tmp/mongosh_*_amd64.deb
RUN /usr/bin/mongosh --version
ENTRYPOINT [ "mongosh" ]
