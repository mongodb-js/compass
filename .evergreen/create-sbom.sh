#! /usr/bin/env bash
set -e
set -x

# create SBOM
CRYPT_SHARED_VERSION=$(cat packages/compass/src/deps/csfle/version)

set +x
echo "${ARTIFACTORY_PASSWORD}" > /tmp/artifactory_password
cat << EOF > /tmp/silkbomb.env
SILK_CLIENT_ID=${SILK_CLIENT_ID}
SILK_CLIENT_SECRET=${SILK_CLIENT_SECRET}
EOF
set -x

trap_handler() {
  rm -vf /tmp/artifactory_password /tmp/silkbomb.env
}
trap trap_handler ERR EXIT

scp -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -P "$SIGNING_SERVER_PORT" .sbom/dependencies.json /tmp/silkbomb.env /tmp/artifactory_password "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME":/tmp/
ssh -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -p "$SIGNING_SERVER_PORT" "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME" \
  "(cat /tmp/dependencies.json | jq -r '.[] | "'"pkg:npm/" + .name + "@" + .version'"' > /tmp/purls.txt) && \
  echo "pkg:generic/mongo_crypt_shared@${CRYPT_SHARED_VERSION}" >> /tmp/purls.txt && \
  (cat /tmp/artifactory_password | docker login artifactory.corp.mongodb.com --username '${ARTIFACTORY_USERNAME}' --password-stdin ; rm -f /tmp/artifactor_password ) && \
  docker pull artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:1.0 && \
  docker run --rm -v /tmp:/tmp artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:1.0 update \
    --purls /tmp/purls.txt --sbom-out /tmp/sbom-lite.json && \
  docker run --env-file /tmp/silkbomb.env --rm -v /tmp:/tmp artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:1.0 upload \
    --silk-asset-group "${SILK_ASSET_GROUP}" --sbom-in /tmp/sbom-lite.json && \
  docker run --env-file /tmp/silkbomb.env --rm -v /tmp:/tmp artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:1.0 download \
    --silk-asset-group "${SILK_ASSET_GROUP}" --sbom-out /tmp/sbom.json"
scp -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -P "$SIGNING_SERVER_PORT" "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME":/tmp/{sbom-lite.json,sbom.json,purls.txt} .sbom/
