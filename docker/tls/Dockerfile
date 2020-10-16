FROM mongo

COPY mongod.conf /etc/mongod.conf
COPY tls /etc/mongod/tls

ENTRYPOINT [ "" ]

CMD [ "mongod", "--bind_ip_all", "--config", "/etc/mongod.conf" ]

EXPOSE 27017
