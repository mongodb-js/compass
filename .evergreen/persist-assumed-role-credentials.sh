#! /usr/bin/env bash

set -e
set +x

# ec2.assume_role only exposes the assumed credentials as redacted Evergreen
# expansions, which are not part of the environment of later commands. Persist
# them to the shared AWS credentials file so that processes which need them
# (e.g. the downloader's S3 client) find them through the default AWS
# credential chain.

mkdir -p ~/.aws

cat > ~/.aws/credentials <<EOF
[default]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}
aws_session_token = ${AWS_SESSION_TOKEN}
EOF

chmod 0600 ~/.aws/credentials
