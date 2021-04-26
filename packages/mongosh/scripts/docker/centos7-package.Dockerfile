FROM centos:7

RUN yum install -y centos-release-scl epel-release
RUN yum repolist
RUN yum install -y python3 rpm-build dpkg-devel dpkg-dev

# Add Git from IUS repo as CentOS has git 1.8.3.1 by default (lerna requires 2.+)
RUN yum install -y https://repo.ius.io/ius-release-el7.rpm
RUN yum install -y git224

# Add Node.js
RUN curl -sL https://rpm.nodesource.com/setup_14.x | bash -
RUN yum install -y nodejs

ENTRYPOINT [ "bash" ]
