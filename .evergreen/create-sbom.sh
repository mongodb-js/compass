#! /usr/bin/env bash
set -e
set -x

# create SBOM
cat .sbom/dependencies.json | \
  jq -r '.[] | "pkg:npm/" + .name + "@" + .version' > .sbom/purls.txt
echo "pkg:generic/mongo_crypt_shared@$(cat packages/compass/src/deps/csfle/version)" >> .sbom/purls.txt

set +x
echo "${ARTIFACTORY_PASSWORD}" > /tmp/artifactory_password
set -x

trap_handler() {
  rm -f /tmp/artifactory_password
}
trap trap_handler ERR EXIT

scp -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -P "$SIGNING_SERVER_PORT" .sbom/purls.txt /tmp/artifactory_password "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME":/tmp/
ssh -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -p "$SIGNING_SERVER_PORT" "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME" \
  "(cat /tmp/artifactory_password | docker login artifactory.corp.mongodb.com --username '${ARTIFACTORY_USERNAME}' --password-stdin ; rm -f /tmp/artifactor_password ) && \
  docker pull artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:1.0 && \
  docker run --rm -v /tmp:/tmp artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:1.0 update \
    --purls /tmp/purls.txt --sbom_out /tmp/sbom.json"
scp -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -P "$SIGNING_SERVER_PORT" "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME":/tmp/sbom.json .sbom/sbom.json
