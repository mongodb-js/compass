if ! command -v docker &> /dev/null
then
    echo "docker could not be found, skipping test environments"
    exit
fi

if ! command -v docker-compose &> /dev/null
then
    echo "docker-compose could not be found, skipping test environments"
    exit
fi

echo "Starting test environments"

git clone -b v1.2.4 https://github.com/mongodb-js/devtools-docker-test-envs.git test-envs
docker-compose -f test-envs/docker/enterprise/docker-compose.yaml up -d
docker-compose -f test-envs/docker/ldap/docker-compose.yaml up -d
docker-compose -f test-envs/docker/scram/docker-compose.yaml up -d
docker-compose -f test-envs/docker/sharded/docker-compose.yaml up -d
docker-compose -f test-envs/docker/ssh/docker-compose.yaml up -d
docker-compose -f test-envs/docker/tls/docker-compose.yaml up -d
docker-compose -f test-envs/docker/kerberos/docker-compose.yaml up -d

__stop_all_docker_containers() {
  echo "Stopping test environments"
  docker-compose -f test-envs/docker/enterprise/docker-compose.yaml down -v --remove-orphans
  docker-compose -f test-envs/docker/ldap/docker-compose.yaml down -v --remove-orphans
  docker-compose -f test-envs/docker/scram/docker-compose.yaml down -v --remove-orphans
  docker-compose -f test-envs/docker/sharded/docker-compose.yaml down -v --remove-orphans
  docker-compose -f test-envs/docker/ssh/docker-compose.yaml down -v --remove-orphans
  docker-compose -f test-envs/docker/tls/docker-compose.yaml down -v --remove-orphans
  docker-compose -f test-envs/docker/kerberos/docker-compose.yaml down -v --remove-orphans
}

trap "__stop_all_docker_containers" EXIT