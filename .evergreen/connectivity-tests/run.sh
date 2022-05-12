#!/usr/bin/env bash

# NOTE: do not -x here there are "env" vars in the commands
set -e

cd $(dirname "$0")

echo "building connectivity tests image from ${0}"
docker build -t devtools-connectivity-tests .
echo "connectivity tests image built"

MONOREPO_ROOT_DIR="$(cd $(dirname "$0")/../..; pwd)"

echo running connectivity tests with volume: "${MONOREPO_ROOT_DIR}"

DOCKER_HOST_GATEWAY=172.17.0.1

docker run \
  --rm \
  -e E2E_TESTS_ATLAS_HOST="${E2E_TESTS_ATLAS_HOST}" \
  -e E2E_TESTS_DATA_LAKE_HOST="${E2E_TESTS_DATA_LAKE_HOST}" \
  -e E2E_TESTS_ANALYTICS_NODE_HOST="${E2E_TESTS_ANALYTICS_NODE_HOST}" \
  -e E2E_TESTS_SERVERLESS_HOST="${E2E_TESTS_SERVERLESS_HOST}" \
  -e E2E_TESTS_FREE_TIER_HOST="${E2E_TESTS_FREE_TIER_HOST}" \
  -e E2E_TESTS_ATLAS_USERNAME="${E2E_TESTS_ATLAS_USERNAME}" \
  -e E2E_TESTS_ATLAS_PASSWORD="${E2E_TESTS_ATLAS_PASSWORD}" \
  -e E2E_TESTS_ATLAS_X509_PEM="${E2E_TESTS_ATLAS_X509_PEM}" \
  -e MONGODB_VERSION="${MONGODB_VERSION}" \
  -e COMPASS_CONNECTIVITY_TESTS_HOST="host.docker.internal" \
  -v "${MONOREPO_ROOT_DIR}":/compass-monorepo-root:ro \
  --add-host host.docker.internal:"${DOCKER_HOST_GATEWAY}" \
  --add-host mongodb-kerberos-1.example.com:"${DOCKER_HOST_GATEWAY}" \
  --add-host mongodb-kerberos-2.example.com:"${DOCKER_HOST_GATEWAY}" \
  --add-host mongodb-kerberos-3.examplecrossrealm.com:"${DOCKER_HOST_GATEWAY}" \
  devtools-connectivity-tests

