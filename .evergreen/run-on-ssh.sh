#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Usage: run-on-ssh.sh <file>"
  exit 1
fi

set -e
echo "Checking environment variables"
echo "garasign_username: ${garasign_username}"
echo "docker_artifactory_username: ${docker_artifactory_username}"

if [ -z ${garasign_username+omitted} ]; then echo "garasign_username is unset" && exit 1; fi
if [ -z ${garasign_password+omitted} ]; then echo "garasign_password is unset" && exit 1; fi
if [ -z ${docker_artifactory_username+omitted} ]; then echo "docker_artifactory_username is unset" && exit 1; fi
if [ -z ${docker_artifactory_password+omitted} ]; then echo "docker_artifactory_password is unset" && exit 1; fi

echo "Logging into docker artifactory"
echo "${docker_artifactory_password}" | docker login --password-stdin --username ${docker_artifactory_username} artifactory.corp.mongodb.com

# If the docker login failed, exit
[ $? -ne 0 ] && exit $?

cat <<EOL > signing-envfile
GRS_CONFIG_USER1_USERNAME=${garasign_username}
GRS_CONFIG_USER1_PASSWORD=${garasign_password}
EOL

directory=$(pwd)
file=$1

echo "File to be signed: $file"
echo "Working directory: $directory"

docker run \
    --env-file=signing-envfile \
    --rm \
    -v $directory:$directory \
    -w $directory \
    artifactory.corp.mongodb.com/release-tools-container-registry-local/garasign-gpg \
    /bin/bash -c "gpgloader && gpg --yes -v --armor -o $file.sig --detach-sign $file"

rm signing-envfile
echo "Finished signing $file"