FROM centos:8

ADD mongodb-enterprise-4.2.repo /etc/yum.repos.d/mongodb-enterprise-4.2.repo
ADD mongod-kerberos.conf /etc/mongod-kerberos.conf
ADD krb5.conf /etc/krb5.conf
ADD wait-for-it.sh /opt/build/wait-for-it.sh
ADD create_users.mongodb /opt/build/create_users.mongodb
ADD build.sh /opt/build/build.sh

WORKDIR /opt/build
RUN chmod +x *.sh
RUN ./build.sh
WORKDIR /
RUN rm -Rf /opt/build

EXPOSE 27017
ENV KRB5_KTNAME /etc/krb5-keytabs/mongodb.keytab

ADD test.sh test.sh
RUN chmod +x test.sh

CMD ["mongod", "--config", "/etc/mongod-kerberos.conf"]

