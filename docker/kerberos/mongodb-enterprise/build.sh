#!/usr/bin/env bash

set -ve

yum -y install mongodb-enterprise \
  krb5-workstation

mkdir -p /data/db
mongod --bind_ip_all \
	--fork \
	--logpath /dev/null \
	--logappend

export MONGODB_HOST="127.0.0.1:27017";

./wait-for-it.sh "${MONGODB_HOST}" -s -- echo "mongodb ready"

mongo "mongodb://${MONGODB_HOST}" create_users.mongodb
mongo "mongodb://${MONGODB_HOST}" --eval 'db.shutdownServer();'

sleep 1
