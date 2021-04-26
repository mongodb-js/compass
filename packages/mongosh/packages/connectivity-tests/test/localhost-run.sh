#!/bin/bash
set -e
set -x

mongod --dbpath /var/mongodb/db &
MONGOD_PID=$!
FAILED=no

sleep 10 # let mongod start up

MONGOSH=/tmp/mongosh/packages/mongosh/bin/mongosh.js
echo 'db.runCommand({ connectionStatus: 1 })' | $MONGOSH | grep -Fq authenticatedUsers || FAILED=yes

kill -INT $MONGOD_PID
wait $MONGOD_PID

if [ $FAILED = yes ]; then
  exit 1
fi
