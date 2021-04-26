#!/usr/bin/env bash

set -e

if [ -t 0 ]; then # Check whether input is a TTY
  DOCKER_FLAGS='-it'
else
  DOCKER_FLAGS='-i'
fi
docker run --rm $DOCKER_FLAGS -e MONGOSH_SMOKE_TEST_SERVER -e IS_CI --network host "mongosh-${1}" ${@:2}
