#! /usr/bin/env bash
set -e
set -x

if [[ "$OSTYPE" == "cygwin" ]]; then
  echo "Starting Installer Service..."
  net start MSIServer
fi

echo "Creating signed release build..."
npm run package-compass-nocompile
npm run generate-first-party-deps-json

ls -la packages/compass/dist
ls -la .sbom

get_compass_package_json_field() {
  node -p 'JSON.parse(fs.readFileSync("packages/compass/package.json"))['"'$1'"']'
}

papertrail() {
  set +x
  echo "X-PAPERTRAIL-KEY-ID: ${PAPERTRAIL_KEY_ID}" > .papertrail.headers
  echo "X-PAPERTRAIL-SECRET-KEY: ${PAPERTRAIL_SECRET_KEY}" >> .papertrail.headers
  set -x

  version=$(get_compass_package_json_field version)
  product="compass"
  if echo "$version" | grep -q -- -dev. ; then
    version+="${EVERGREEN_REVISION}_${EVERGREEN_REVISION_ORDER_ID}"
    product+="-dev"
  elif echo "$version" | grep -q -- -beta. ; then
    product+="-beta"
  fi
  build="${EVERGREEN_TASK_ID}_${EVERGREEN_EXECUTION}"
  platform="evergreen"
  submitter=$(get_compass_package_json_field releasePublisher)
  if [ $submitter = "null" ]; then
    submitter="${EVERGREEN_AUTHOR}"
  fi

  for file in packages/compass/dist/* ; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      checksum=$(shasum -a 256 "$file" | cut -f1 -d' ')

      curl -G -X POST -H @.papertrail.headers "https://papertrail.devprod-infra.prod.corp.mongodb.com/trace" \
        --data-urlencode "version=${version}" \
        --data-urlencode "product=${product}" \
        --data-urlencode "sha256=${checksum}" \
        --data-urlencode "filename=${filename}" \
        --data-urlencode "build=${build}" \
        --data-urlencode "platform=${platform}" \
        --data-urlencode "submitter=${submitter}"
    fi
  done

  rm -f .papertrail.headers
}

papertrail
