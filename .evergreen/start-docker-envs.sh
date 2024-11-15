#########################################################
###                 !!! IMPORTANT !!!                 ###
###  THIS SCRIPT IS EXECUTED WITH THE SOURCE COMMAND  ###
###   IN CI SHELL AND SHOULD NEVER EXIT ON ITS OWN    ###
#########################################################

set -e

HAS_DOCKER=false

DOCKER_COMPOSE=""

echo "Checking if docker is available ..."

if docker version &>/dev/null; then
  echo "  docker is available, checking docker compose"
  if docker compose version &>/dev/null; then
    echo "  docker compose is available"
    HAS_DOCKER=true
    DOCKER_COMPOSE="env MONGODB_VERSION= docker compose"
  else
    echo " docker compose could not be found, trying standalone docker-compose as a fallback"
    if docker-compose version &>/dev/null; then
      HAS_DOCKER=true
      DOCKER_COMPOSE="env MONGODB_VERSION= docker-compose"
    else
      echo "  docker compose not found"
    fi
  fi
fi

if [ "$HAS_DOCKER" = true ]; then
  docker version
  $DOCKER_COMPOSE version

  if [ -n "$DOCKERHUB_PASSWORD" ]; then
    echo "Logging in to docker"
    echo "${DOCKERHUB_PASSWORD}" | docker login -u ${DOCKERHUB_USERNAME} --password-stdin
  fi

  echo "Starting test environments"

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
  LOGS_DIR="$SCRIPT_DIR/logs"
  mkdir -p "$LOGS_DIR"

  git clone -b v1.3.2 --single-branch https://github.com/mongodb-js/devtools-docker-test-envs.git test-envs
  $DOCKER_COMPOSE -f test-envs/docker/enterprise/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/ldap/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/scram/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/sharded/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/ssh/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/tls/docker-compose.yaml up -d
  $DOCKER_COMPOSE -f test-envs/docker/kerberos/docker-compose.yaml up -d

  __stop_all_docker_containers() {
    echo "Stopping test environments"
    $DOCKER_COMPOSE -f test-envs/docker/enterprise/docker-compose.yaml ps >$LOGS_DIR/docker-enterprise.ps || true
    $DOCKER_COMPOSE -f test-envs/docker/ldap/docker-compose.yaml ps >$LOGS_DIR/docker-ldap.ps || true
    $DOCKER_COMPOSE -f test-envs/docker/scram/docker-compose.yaml ps >$LOGS_DIR/docker-scram.ps || true
    $DOCKER_COMPOSE -f test-envs/docker/sharded/docker-compose.yaml ps >$LOGS_DIR/docker-sharded.ps || true
    $DOCKER_COMPOSE -f test-envs/docker/ssh/docker-compose.yaml ps >$LOGS_DIR/docker-ssh.ps || true
    $DOCKER_COMPOSE -f test-envs/docker/tls/docker-compose.yaml ps >$LOGS_DIR/docker-tls.ps || true
    $DOCKER_COMPOSE -f test-envs/docker/kerberos/docker-compose.yaml ps >$LOGS_DIR/docker-kerberos.ps || true

    $DOCKER_COMPOSE -f test-envs/docker/enterprise/docker-compose.yaml logs >$LOGS_DIR/docker-enterprise.log || true
    $DOCKER_COMPOSE -f test-envs/docker/ldap/docker-compose.yaml logs >$LOGS_DIR/docker-ldap.log || true
    $DOCKER_COMPOSE -f test-envs/docker/scram/docker-compose.yaml logs >$LOGS_DIR/docker-scram.log || true
    $DOCKER_COMPOSE -f test-envs/docker/sharded/docker-compose.yaml logs >$LOGS_DIR/docker-sharded.log || true
    $DOCKER_COMPOSE -f test-envs/docker/ssh/docker-compose.yaml logs >$LOGS_DIR/docker-ssh.log || true
    $DOCKER_COMPOSE -f test-envs/docker/tls/docker-compose.yaml logs >$LOGS_DIR/docker-tls.log || true
    $DOCKER_COMPOSE -f test-envs/docker/kerberos/docker-compose.yaml logs >$LOGS_DIR/docker-kerberos.log || true

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
