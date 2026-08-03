#! /usr/bin/env bash
set -e
set -x

# create SBOM
CRYPT_SHARED_VERSION=$(cat packages/compass/src/deps/csfle/version)
ECR_HOST="901841024863.dkr.ecr.us-east-1.amazonaws.com"

set +x
echo "${ECR_LOGIN_PASSWORD}" > /tmp/ecr_login_password
set -x

trap_handler() {
  rm -vf /tmp/ecr_login_password
}
trap trap_handler ERR EXIT

# https://jira.mongodb.org/browse/MONGOSH-1856
cp -v node_modules/@mongosh/node-runtime-worker-thread/dist/purls.txt node-runtime-worker-thread-purls.txt
scp -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -P "$SIGNING_SERVER_PORT" \
  .sbom/dependencies.json /tmp/ecr_login_password node-runtime-worker-thread-purls.txt \
  "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME":/tmp/
ssh -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -p "$SIGNING_SERVER_PORT" "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME" \
  "(cat /tmp/dependencies.json | jq -r '.[] | \"pkg:npm/\" + .name + \"@\" + .version' > /tmp/purls.txt) && \
  cat /tmp/node-runtime-worker-thread-purls.txt >> /tmp/purls.txt && \
  echo "pkg:generic/mongo_crypt_shared@${CRYPT_SHARED_VERSION}" >> /tmp/purls.txt && \
  cat /tmp/purls.txt | sort | uniq > /tmp/purls-deduped.txt && mv /tmp/purls-deduped.txt /tmp/purls.txt && \
  (cat /tmp/ecr_login_password | docker login ${ECR_HOST} --username AWS --password-stdin ; rm -f /tmp/ecr_login_password ) && \
  docker pull ${ECR_HOST}/release-infrastructure/silkbomb:2.0 && \
  docker run --rm -v /tmp:/tmp ${ECR_HOST}/release-infrastructure/silkbomb:2.0 update \
    --purls /tmp/purls.txt --sbom-out /tmp/sbom-lite.json && \
  kondukto_token=\$(AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
                  AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
                  AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN} \
                  aws secretsmanager get-secret-value --secret-id \"kondukto-token\" --query 'SecretString' --output text) && \
  echo \"KONDUKTO_TOKEN=\$kondukto_token\" > /tmp/kondukto_credentials.env && \
  docker run --env-file /tmp/kondukto_credentials.env --rm -v /tmp:/tmp ${ECR_HOST}/release-infrastructure/silkbomb:2.0 augment \
    --repo mongodb-js/compass --branch ${KONDUKTO_BRANCH} --sbom-in /tmp/sbom-lite.json --sbom-out /tmp/sbom.json"
scp -v -i "$SIGNING_SERVER_PRIVATE_KEY_CYGPATH" -P "$SIGNING_SERVER_PORT" "$SIGNING_SERVER_USERNAME"@"$SIGNING_SERVER_HOSTNAME":/tmp/{sbom-lite.json,sbom.json,purls.txt} .sbom/
