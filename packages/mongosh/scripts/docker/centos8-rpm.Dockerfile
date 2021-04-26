FROM centos:8

ARG artifact_url=""
ADD ${artifact_url} /tmp
RUN yum repolist
RUN yum install -y /tmp/mongosh-*-x86_64.rpm
ENTRYPOINT [ "mongosh" ]
