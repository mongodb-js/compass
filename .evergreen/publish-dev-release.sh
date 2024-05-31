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

URL="https://mciuploads.s3.amazonaws.com/${EVERGREEN_PROJECT}/compass/dev/$1"
TMP_FILE=$(mktemp)
CURRENT_VERSION="0.0.0-dev.0"

if [ "$(curl -s -w "%{http_code}" -o "$TMP_FILE" "$URL" | tail -n1)" -eq 200 ]; then
  CURRENT_VERSION=$(xargs < "$TMP_FILE")
fi

npm install -g semver

echo "Comparing versions: $CURRENT_VERSION and $DEV_VERSION_IDENTIFIER"
PUBLISH_VERSION=$(npx semver "$CURRENT_VERSION" "$DEV_VERSION_IDENTIFIER" | tail -n1 | xargs)
echo "$PUBLISH_VERSION" > "$1"