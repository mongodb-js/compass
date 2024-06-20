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
IMAGE_NAME="mongodb/mongodb-atlas-local:$ATLAS_LOCAL_VERSION"
echo docker run --rm --name $CONTAINER_NAME -d -e DO_NOT_TRACK=1 -P "$IMAGE_NAME"

# Start the Docker container
docker run --rm --name $CONTAINER_NAME -d -e DO_NOT_TRACK=1 -P "$IMAGE_NAME"

echo "Waiting for container to become healthy..."

STATUS=""
while true; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME || "null")
  echo "Status: $STATUS"

  if [[ "starting" != "$STATUS" ]]; then
    break
  fi

  sleep 2
done

if [[ "healthy" != "$STATUS" ]]; then
  echo "Atlas Local is not healty, exiting."
  exit 1
fi

EXPOSED_PORT=$(docker inspect --format='{{ (index (index .NetworkSettings.Ports "27017/tcp") 0).HostPort }}' $CONTAINER_NAME)

export ATLAS_LOCAL_URL="mongodb://127.0.0.1:$EXPOSED_PORT/test?directConnection=true"
echo "ATLAS_LOCAL_URL set to $ATLAS_LOCAL_URL"
