#!/usr/bin/env bash

# NOTE: do not -x here there are "env" vars in the commands
set -e

MONOREPO_ROOT_DIR="$(cd $(dirname "$0")/../..; pwd)"
cd $MONOREPO_ROOT_DIR

echo "building connectivity tests image from ${PWD}"
docker build -t devtools-connectivity-tests -f "./.evergreen/connectivity-tests/Dockerfile" .
echo "connectivity tests image built"

echo running connectivity tests image

docker run \
  --rm \
  -e DEBUG="${DEBUG}" \
  -e E2E_TESTS_ATLAS_HOST="${E2E_TESTS_ATLAS_HOST}" \
  -e E2E_TESTS_DATA_LAKE_HOST="${E2E_TESTS_DATA_LAKE_HOST}" \
  -e E2E_TESTS_ANALYTICS_NODE_HOST="${E2E_TESTS_ANALYTICS_NODE_HOST}" \
  -e E2E_TESTS_SERVERLESS_HOST="${E2E_TESTS_SERVERLESS_HOST}" \
  -e E2E_TESTS_FREE_TIER_HOST="${E2E_TESTS_FREE_TIER_HOST}" \
  -e E2E_TESTS_ATLAS_USERNAME="${E2E_TESTS_ATLAS_USERNAME}" \
  -e E2E_TESTS_ATLAS_PASSWORD="${E2E_TESTS_ATLAS_PASSWORD}" \
  -e E2E_TESTS_ATLAS_X509_PEM="${E2E_TESTS_ATLAS_X509_PEM}" \
  -e MONGODB_VERSION="${MONGODB_VERSION}" \
  --add-host mongodb-kerberos-1.example.com:0.0.0.0 \
  --add-host mongodb-kerberos-2.example.com:0.0.0.0 \
  --add-host mongodb-kerberos-3.examplecrossrealm.com:0.0.0.0 \
  --network host \
  devtools-connectivity-tests

