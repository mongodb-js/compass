#!/usr/bin/env bash

echo 'password' | kinit mongodb.user@EXAMPLE.COM

mongo --quiet \
  --host mongodb-enterprise.EXAMPLE.COM \
  --authenticationDatabase '$external' \
  --authenticationMechanism GSSAPI \
  -u mongodb.user@EXAMPLE.COM