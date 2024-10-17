#!/bin/bash

export E2E_ATLAS_CLOUD_TEST_CLUSTER_NAME="test-cluster-$(date +"%s")"

function atlascli() {
  docker run \
    -e MCLI_PUBLIC_API_KEY="$MCLI_PUBLIC_API_KEY" \
    -e MCLI_PRIVATE_API_KEY="$MCLI_PRIVATE_API_KEY" \
    -e MCLI_ORG_ID="$MCLI_ORG_ID" \
    -e MCLI_PROJECT_ID="$MCLI_PROJECT_ID" \
    -e MCLI_OPS_MANAGER_URL="$MCLI_OPS_MANAGER_URL" \
    mongodb/atlas atlas $@
}

cleanup() {
  echo "Scheduling Atlas deployment \`$E2E_ATLAS_CLOUD_TEST_CLUSTER_NAME\` for deletion..."
  atlascli clusters delete $E2E_ATLAS_CLOUD_TEST_CLUSTER_NAME --force
}

trap cleanup EXIT

echo "Creating Atlas deployment \`$E2E_ATLAS_CLOUD_TEST_CLUSTER_NAME\` to test against..."
atlascli clusters create $E2E_ATLAS_CLOUD_TEST_CLUSTER_NAME \
  --provider AWS \
  --region US_EAST_1 \
  --tier M10

echo "Waiting for the deployment to be provisioned..."
atlascli clusters watch "$E2E_ATLAS_CLOUD_TEST_CLUSTER_NAME"

echo "Getting connection string for provisioned cluster..."
export E2E_ATLAS_CLOUD_TEST_CLUSTER_CONNECTION_STRING_JSON="$(atlascli clusters connectionStrings describe $E2E_ATLAS_CLOUD_TEST_CLUSTER_NAME -o json)"
echo "Cluster connection string: $E2E_ATLAS_CLOUD_TEST_CLUSTER_CONNECTION_STRING_JSON"
