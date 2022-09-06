#! /usr/bin/env bash

set -e

if ! command -v docker &>/dev/null; then
  echo "docker could not be found"
elif ! command -v docker-compose &>/dev/null; then
  echo "docker-compose could not be found"
else
  echo "Starting test environments"

  DOCKER_COMPOSE="env MONGODB_VERSION= docker-compose"

  git clone -b v1.2.4 --single-branch https://github.com/mongodb-js/devtools-docker-test-envs.git test-envs
  $DOCKER_COMPOSE -f test-envs/docker/enterprise/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/ldap/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/scram/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/sharded/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/ssh/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/tls/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/kerberos/docker-compose.yaml up -d

  __stop_all_docker_containers() {
    echo "Stopping test environments"
    $DOCKER_COMPOSE -f test-envs/docker/enterprise/docker-compose.yaml down -v --remove-orphans
    $DOCKER_COMPOSE -f test-envs/docker/ldap/docker-compose.yaml down -v --remove-orphans
    $DOCKER_COMPOSE -f test-envs/docker/scram/docker-compose.yaml down -v --remove-orphans
    $DOCKER_COMPOSE -f test-envs/docker/sharded/docker-compose.yaml down -v --remove-orphans
    $DOCKER_COMPOSE -f test-envs/docker/ssh/docker-compose.yaml down -v --remove-orphans
    $DOCKER_COMPOSE -f test-envs/docker/tls/docker-compose.yaml down -v --remove-orphans
    $DOCKER_COMPOSE -f test-envs/docker/kerberos/docker-compose.yaml down -v --remove-orphans
  }

  trap "__stop_all_docker_containers" EXIT
fi
