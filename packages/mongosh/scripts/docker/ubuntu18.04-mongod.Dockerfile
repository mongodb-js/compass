FROM mongo:4.4
COPY --from=node:14 /usr/local/bin/node /usr/local/bin/node

RUN mkdir -p /var/mongodb/db
RUN mongod --version

ENTRYPOINT [ "bash" ]
