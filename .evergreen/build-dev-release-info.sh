#! /usr/bin/env bash

set -e
set -x

if [[ "${EVERGREEN_PROJECT}" != "10gen-compass-main" ]]; then
  echo "Trying to publish main compass (dev build) from ${EVERGREEN_PROJECT} project. Skipping...";
  exit 0;
fi

if [[ "${EVERGREEN_BRANCH_NAME}" != "main" ]]; then
  echo "Trying to publish main compass (dev build) from ${EVERGREEN_BRANCH_NAME} branch. Skipping...";
  exit 0;
fi

JSON_CONTENT=$( jq -n \
  --arg id "$DEV_VERSION_IDENTIFIER" \
  --arg key "${EVERGREEN_BUCKET_KEY_PREFIX}" \
  '{version: $id, bucket_key_prefix: $key}'
)

URL="https://downloads.mongodb.com/compass-dev/$1"
DATA=$(curl -sf "${URL}" || echo "$JSON_CONTENT")
CURRENT_VERSION=$(echo "$DATA" | jq -r '.version')

echo "Comparing versions: $CURRENT_VERSION and $DEV_VERSION_IDENTIFIER"
LATEST_VERSION=$(npx semver "$CURRENT_VERSION" "$DEV_VERSION_IDENTIFIER" | tail -n1 | xargs)

if [[ "$LATEST_VERSION" == "$CURRENT_VERSION" ]]; then
  echo "Skipping publishing dev release, version $DEV_VERSION_IDENTIFIER is not newer than $CURRENT_VERSION"
  exit 0
fi

echo "$JSON_CONTENT" > "$1"