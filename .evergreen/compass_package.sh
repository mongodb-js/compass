#! /usr/bin/env bash
set -e
set -x

if [[ "$OSTYPE" == "cygwin" ]]; then
  echo "Starting Installer Service..."
  net start MSIServer
fi

# Ensure .sbom is always created with fresh data
rm -rvf .sbom && mkdir -pv .sbom

echo "Creating signed release build..."
npm run package-compass $COMPASS_DISTRIBUTION;
npm run generate-first-party-deps-json

ls -la packages/compass/dist
ls -la .sbom

papertrail() {
  set +x
  echo "X-PAPERTRAIL-KEY-ID: ${PAPERTRAIL_KEY_ID}" > .papertrail.headers
  echo "X-PAPERTRAIL-SECRET-KEY: ${PAPERTRAIL_SECRET_KEY}" >> .papertrail.headers
  set -x

  version=$(jq -r '.version' < packages/compass/package.json)
  if echo $version | grep -q -- -dev. ; then
    version+="${EVERGREEN_REVISION}_${EVERGREEN_REVISION_ORDER_ID}"
  fi
  product="compass"
  build="${EVERGREEN_TASK_ID}_${EVERGREEN_EXECUTION}"
  platform="evergreen"
  submitter=$(jq -r '.releasePublisher' < packages/compass/package.json)
  if [ $submitter = "null" ]; then
    submitter="${EVERGREEN_AUTHOR}"
  fi

  for file in packages/compass/dist/* ; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      checksum=$(shasum -a 256 "$file" | cut -f1 -d' ')
      params="version=${version}&product=${product}&sha256=${checksum}&filename=${filename}&build=${build}&platform=${platform}&submitter=${submitter}"

      curl -X POST -H @.papertrail.headers "https://papertrail.devprod-infra.prod.corp.mongodb.com/trace?${params}"
    fi
  done

  rm -f .papertrail.headers
}

papertrail
