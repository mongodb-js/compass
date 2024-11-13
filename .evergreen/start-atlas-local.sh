#!/bin/bash

# Check if ATLAS_LOCAL_VERSION is set
if [ -z "$ATLAS_LOCAL_VERSION" ]; then
  echo "ATLAS_LOCAL_VERSION is not set. Skipping script."
  return
fi

# Container name
CONTAINER_NAME=compass-e2e-tests-atlas-local

docker rm -f $CONTAINER_NAME || true

cleanup() {
  echo "Stopping and removing container..."
  docker stop $CONTAINER_NAME || true
  docker rm -f $CONTAINER_NAME || true
}

trap cleanup EXIT

# Image name with version
DOCKER_REGISTRY="${DOCKER_REGISTRY-registry.hub.docker.com}"
DOCKER_IMAGE="$DOCKER_REGISTRY/library/mongodb/mongodb-atlas-local:$ATLAS_LOCAL_VERSION"
echo docker run --rm --name $CONTAINER_NAME -d -e DO_NOT_TRACK=1 -P "$DOCKER_IMAGE"

# Start the Docker container
docker run --rm --name $CONTAINER_NAME -d -e DO_NOT_TRACK=1 -P "$DOCKER_IMAGE"

echo "Waiting for container to become healthy..."

STATUS=""
CONSECUTIVE_FAILED_ATTEMPTS=0
MAX_CONSECUTIVE_FAILED_ATTEMPTS=20

while true; do
  INSPECT_OUTPUT=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>&1)
  if [[ $? -ne 0 ]]; then
    echo "Inspect Failed: ${INSPECT_OUTPUT}"
    STATUS="failed"
  else
    STATUS="$INSPECT_OUTPUT"
  fi

  echo "Status: $STATUS"

  if [[ "$STATUS" != "starting" && "$STATUS" != "failed" ]]; then
    break
  fi

  if [[ "$STATUS" == "failed" ]]; then
    CONSECUTIVE_FAILED_ATTEMPTS=$((CONSECUTIVE_FAILED_ATTEMPTS + 1))
  else
    CONSECUTIVE_FAILED_ATTEMPTS=0
  fi

  if [[ $CONSECUTIVE_FAILED_ATTEMPTS -ge $MAX_CONSECUTIVE_FAILED_ATTEMPTS ]]; then
    echo "Maximum number of consecutive failed attempts reached. Exiting."
    exit 1
  fi

  sleep 2
done

if [[ "$STATUS" != "healthy" ]]; then
  echo "Atlas Local is not healthy, exiting."
  exit 1
fi

EXPOSED_PORT=$(docker inspect --format='{{ (index (index .NetworkSettings.Ports "27017/tcp") 0).HostPort }}' $CONTAINER_NAME)

export ATLAS_LOCAL_URL="mongodb://127.0.0.1:$EXPOSED_PORT/test?directConnection=true"
echo "ATLAS_LOCAL_URL set to $ATLAS_LOCAL_URL"
