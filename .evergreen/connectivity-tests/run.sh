#!/usr/bin/env bash

set -e

MONOREPO_ROOT_DIR="$(cd $(dirname "$0")/../..; pwd)"

docker build -t devtools-connectivity-tests .

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
  --add-host host.docker.internal:host-gateway \
  --add-host mongodb-kerberos-1.example.com:host-gateway \
  --add-host mongodb-kerberos-2.example.com:host-gateway \
  --add-host mongodb-kerberos-3.examplecrossrealm.com:host-gateway \
  devtools-connectivity-tests

