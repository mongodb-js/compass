#!/bin/bash

RUN_ID="$(date +"%s")-$(git rev-parse --short HEAD)"
DELETE_AFTER="$(date -u -Iseconds -d '+2 hours' 2>/dev/null || date -u -Iseconds -v '+2H')"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"

# This script helps to automatically provision Atlas cluster for running the e2e
# tests against. In CI this will always create a new cluster and delete it when
# the test run is finished. You can also use this script locally to run e2e
# tests against a "logged in" Atlas Cloud experience in compass-web sandbox.
#
# While the provisioning of clusters is automated, you should be aware that it
# requires some extra environmental variables to be available when you are
# running it. If you want to be able to run these e2e tests locally, following
# steps are required:
#
# - Create a test Atlas user on one of the testing environments (-dev / -qa).
#   You can only use your work emails with a subaddress to create those (e.g,
#   jane.doe+for-testing@mongodb.com).
#
# - Setup a new org and project. Save the org id and project id for later.
#
# - Add test payment details within the organization (Billing) to be able to
#   create clusters.
#
# - Create a new API key (Access Manager > Project Access > Create Application >
#   API Key) for the project you created and save the public and private keys.
#
# - (Optional) Deploy a cluster with a required configuration through Atlas
#   Cloud UI. If you skip the step, the script will deploy a default cluster for
#   you.
#
# - Make sure that you have the following environmental variables provided to
#   the script below:
#
#     MCLI_OPS_MANAGER_URL  API base url matching the environment you used to
#                           create your user (https://cloud{-dev,-qa}.mongodb.com/)
#     MCLI_PUBLIC_API_KEY   Public API key
#     MCLI_PRIVATE_API_KEY  Private API key
#     MCLI_ORG_ID           Org ID
#     MCLI_PROJECT_ID       Project ID
#
#     COMPASS_E2E_ATLAS_CLOUD_SANDBOX_USERNAME  Cloud user you created
#     COMPASS_E2E_ATLAS_CLOUD_SANDBOX_PASSWORD  Cloud user password
#
# - Source the script followed by running the tests to make sure that some
#   variables exported from this script are available for the test env:
#
#   (ATLAS_CLOUD_TEST_CLUSTER_NAME="TestCluster" source .evergreen/start-atlas-cloud-cluster.sh \
#     && npm run -w compass-e2e-tests test web -- --test-atlas-cloud-sandbox --test-filter="atlas-cloud/**/*")

_ATLAS_CLOUD_TEST_CLUSTER_NAME=${ATLAS_CLOUD_TEST_CLUSTER_NAME:-""}

# Atlas limits the naming to something like /^[\w\d-]{,23}$/ (and will auto
# truncate if it's too long) so we're very limited in terms of how unique this
# name can be. Hopefully the epoch + part of git hash is enough for these to not
# overlap when tests are running
DEFAULT_ATLAS_CLOUD_TEST_CLUSTER_NAME="e2e-$RUN_ID"

ATLAS_CLUSTER_NAME="${_ATLAS_CLOUD_TEST_CLUSTER_NAME:-$DEFAULT_ATLAS_CLOUD_TEST_CLUSTER_NAME}"

ATLAS_TEST_DB_USERNAME="testuser-$RUN_ID"
ATLAS_TEST_DB_PASSWORD="$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')"

function atlascli() {
  docker run \
    -e MCLI_PUBLIC_API_KEY \
    -e MCLI_PRIVATE_API_KEY \
    -e MCLI_ORG_ID \
    -e MCLI_PROJECT_ID \
    -e MCLI_OPS_MANAGER_URL \
    "$DOCKER_REGISTRY/mongodb/atlas" atlas $@
}

cleanup() {
  # Assuming that we want to preserve the cluster if the name was provided
  # outside of script. Helpful when trying to run the tests locally, you can
  # automatically create a cluster with a custom name for the first time, but
  # then re-use it when running the tests again. Don't forget to clean it up
  # after you're done!
  if [ -z "$_ATLAS_CLOUD_TEST_CLUSTER_NAME" ]; then
    echo "Scheduling Atlas deployment \`$ATLAS_CLUSTER_NAME\` for deletion..."
    atlascli clusters delete $ATLAS_CLUSTER_NAME --force
  else
    echo "Custom cluster name provided ($_ATLAS_CLOUD_TEST_CLUSTER_NAME), skipping cluster cleanup"
  fi
  echo "Deleting Atlas db user \`$ATLAS_TEST_DB_USERNAME\`..."
  atlascli dbusers delete $ATLAS_TEST_DB_USERNAME --force
}

trap cleanup EXIT

echo "Allowing access from current ip..."
atlascli accessList create \
  --currentIp \
  --deleteAfter "$DELETE_AFTER"

echo "Creating Atlas db user \`$ATLAS_TEST_DB_USERNAME\`..."
atlascli dbusers create atlasAdmin \
  --username "$ATLAS_TEST_DB_USERNAME" \
  --password "$ATLAS_TEST_DB_PASSWORD" \
  --deleteAfter "$DELETE_AFTER" # so that it's autoremoved if cleaning up failed for some reason

export COMPASS_E2E_ATLAS_CLOUD_SANDBOX_DBUSER_USERNAME="$ATLAS_TEST_DB_USERNAME"
export COMPASS_E2E_ATLAS_CLOUD_SANDBOX_DBUSER_PASSWORD="$ATLAS_TEST_DB_PASSWORD"

echo "Creating Atlas deployment \`$ATLAS_CLUSTER_NAME\` to test against..."
(atlascli clusters create $ATLAS_CLUSTER_NAME \
  --provider AWS \
  --region US_EAST_1 \
  --tier M10 \
  --type GEOSHARDED || true) # can error if custom name was provided, will fail on next step if it's not expected failure

echo "Waiting for the deployment to be provisioned..."
atlascli clusters watch $ATLAS_CLUSTER_NAME

echo "Getting connection string for provisioned cluster..."
CONNECTION_STRINGS_JSON="$(atlascli clusters connectionStrings describe $ATLAS_CLUSTER_NAME -o json)"

export COMPASS_E2E_ATLAS_CLOUD_SANDBOX_CLOUD_CONFIG=$(
  if [[ "$MCLI_OPS_MANAGER_URL" =~ "-dev" ]]; then
    echo "dev"
  elif [[ "$MCLI_OPS_MANAGER_URL" =~ "-qa" ]]; then
    echo "qa"
  else
    echo "prod"
  fi
)
echo "Cloud config: $COMPASS_E2E_ATLAS_CLOUD_SANDBOX_CLOUD_CONFIG"

export COMPASS_E2E_ATLAS_CLOUD_SANDBOX_DEFAULT_CONNECTIONS="{\"$ATLAS_CLUSTER_NAME\": $CONNECTION_STRINGS_JSON}"
echo "Cluster connections: $COMPASS_E2E_ATLAS_CLOUD_SANDBOX_DEFAULT_CONNECTIONS"
