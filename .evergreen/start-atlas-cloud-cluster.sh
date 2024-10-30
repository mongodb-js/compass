#!/bin/bash

# Atlas limits the naming to something like /^[\w\d-]{,23}$/ (and will auto
# truncate if it's too long) so we're very limited in terms of how unique this
# name can be. Hopefully the epoch + part of git hash is enough for these to not
# overlap when tests are running
ATLAS_CLOUD_TEST_CLUSTER_NAME="e2e-$(date +"%s")-$(git rev-parse HEAD)"

function atlascli() {
  docker run \
    -e MCLI_PUBLIC_API_KEY \
    -e MCLI_PRIVATE_API_KEY \
    -e MCLI_ORG_ID \
    -e MCLI_PROJECT_ID \
    -e MCLI_OPS_MANAGER_URL \
    mongodb/atlas atlas $@
}

cleanup() {
  echo "Scheduling Atlas deployment \`$ATLAS_CLOUD_TEST_CLUSTER_NAME\` for deletion..."
  atlascli clusters delete $ATLAS_CLOUD_TEST_CLUSTER_NAME --force
}

trap cleanup EXIT

echo "Creating Atlas deployment \`$ATLAS_CLOUD_TEST_CLUSTER_NAME\` to test against..."
atlascli clusters create $ATLAS_CLOUD_TEST_CLUSTER_NAME \
  --provider AWS \
  --region US_EAST_1 \
  --tier M10

echo "Waiting for the deployment to be provisioned..."
atlascli clusters watch "$ATLAS_CLOUD_TEST_CLUSTER_NAME"

echo "Getting connection string for provisioned cluster..."
ATLAS_CLOUD_TEST_CLUSTER_CONNECTION_STRING_JSON="$(atlascli clusters connectionStrings describe $ATLAS_CLOUD_TEST_CLUSTER_NAME -o json)"

export COMPASS_E2E_ATLAS_CLOUD_SANDBOX_DEFAULT_CONNECTIONS="{\"$ATLAS_CLOUD_TEST_CLUSTER_NAME\": $ATLAS_CLOUD_TEST_CLUSTER_CONNECTION_STRING_JSON}"
echo "Cluster connections: $COMPASS_E2E_ATLAS_CLOUD_SANDBOX_DEFAULT_CONNECTIONS"
