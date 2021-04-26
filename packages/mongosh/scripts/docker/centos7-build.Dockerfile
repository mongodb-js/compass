FROM centos:7

RUN yum install -y centos-release-scl epel-release
RUN yum repolist
RUN yum install -y python3 devtoolset-8 cmake
RUN scl enable devtoolset-8 bash

# Add Git from IUS repo as CentOS has git 1.8.3.1 by default (lerna requires 2.+)
RUN yum install -y https://repo.ius.io/ius-release-el7.rpm
RUN yum install -y git224

# Add Node.js
RUN curl -sL https://rpm.nodesource.com/setup_14.x | bash -
RUN yum install -y nodejs

# Add sccache
RUN curl -L https://github.com/mozilla/sccache/releases/download/0.2.13/sccache-0.2.13-x86_64-unknown-linux-musl.tar.gz | tar -C /usr/local/bin -xzvf - --strip=1 sccache-0.2.13-x86_64-unknown-linux-musl/sccache

ENV CC="sccache gcc"
ENV CXX="sccache g++"

RUN bash -c 'source /opt/rh/devtoolset-8/enable && g++ --version && git --version'

ENTRYPOINT [ "bash" ]
