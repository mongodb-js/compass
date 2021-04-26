#!/bin/bash
set -e
set -x

function try_connect_explicit() {
  echo 'db.runCommand({ connectionStatus: 1 }).authInfo.authenticatedUsers' |
    (mongosh \
      --host localhost \
      --port 30017 \
      --username "$1" \
      --password "$2" \
      --authenticationMechanism PLAIN \
      --authenticationDatabase '$external' |
    grep -Fq "$1" && echo 'no') || echo 'yes'
}

function try_connect_connection_string() {
  echo 'db.runCommand({ connectionStatus: 1 }).authInfo.authenticatedUsers' |
    (mongosh "$1" | grep -Fq "$2" && echo 'no') || echo 'yes'
}

function test_for_version() {
  MONGODB_VERSION="$1" docker-compose -f ldap/docker-compose.yaml up -d

  sleep 10 # let mongod start up
  FAILED_EXPLICIT=$(try_connect_explicit 'writer@EXAMPLE.COM' 'Password1!')
  FAILED_CONNECTION_STRING=$(try_connect_connection_string 'mongodb://writer%40EXAMPLE.COM:Password1!@localhost:30017/$external?authMechanism=PLAIN' 'writer@EXAMPLE.COM')

  MONGODB_VERSION="$1" docker-compose -f ldap/docker-compose.yaml down

  if [ $FAILED_EXPLICIT = yes ]; then
    ANY_FAILED=yes
    echo "LDAP test with explicit username/password failed for $1"
  fi

  if [ $FAILED_CONNECTION_STRING = yes ]; then
    ANY_FAILED=yes
    echo "LDAP test with connection string failed for $1"
  fi
}

ANY_FAILED=no
test_for_version '4.2'
test_for_version '4.4'

if [ $ANY_FAILED = yes ]; then
  exit 1
fi
