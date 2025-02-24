#! /usr/bin/env bash
set -e
set -x

# create SBOM
CRYPT_SHARED_VERSION=$(cat packages/compass/src/deps/csfle/version)

set +x
echo "${ARTIFACTORY_PASSWORD}" > /tmp/artifactory_password
set -x

trap_handler() {
  rm -vf /tmp/artifactory_password
}
trap trap_handler ERR EXIT

scp -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -P "$SIGNING_SERVER_PORT" .sbom/dependencies.json /tmp/artifactory_password "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME":/tmp/
ssh -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -p "$SIGNING_SERVER_PORT" "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME" \
  "(cat /tmp/dependencies.json | jq -r '.[] | "'"pkg:npm/" + .name + "@" + .version'"' > /tmp/purls.txt) && \
  echo "pkg:generic/mongo_crypt_shared@${CRYPT_SHARED_VERSION}" >> /tmp/purls.txt && \
  (cat /tmp/artifactory_password | docker login artifactory.corp.mongodb.com --username '${ARTIFACTORY_USERNAME}' --password-stdin ; rm -f /tmp/artifactory_password ) && \
  docker pull artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:2.0 && \
  docker run --rm -v /tmp:/tmp artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:2.0 update \
    --purls /tmp/purls.txt --sbom-out /tmp/sbom-lite.json && \
  kondukto_token=\$(AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
                  AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
                  AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN} \
                  aws secretsmanager get-secret-value --secret-id \"kondukto-token\" --query 'SecretString' --output text) && \
  echo \"KONDUKTO_TOKEN=\$kondukto_token\" > /tmp/kondukto_credentials.env && \
  docker run --env-file /tmp/kondukto_credentials.env --rm -v /tmp:/tmp artifactory.corp.mongodb.com/release-tools-container-registry-public-local/silkbomb:2.0 augment \
    --repo mongodb-js/compass --branch ${KONDUKTO_BRANCH} --sbom-in /tmp/sbom-lite.json --sbom-out /tmp/sbom.json"
scp -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -P "$SIGNING_SERVER_PORT" "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME":/tmp/{sbom-lite.json,sbom.json,purls.txt} .sbom/