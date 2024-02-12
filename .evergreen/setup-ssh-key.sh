#! /usr/bin/env bash

set -e
set +x
echo "${__project_aws_ssh_key_value}" > ~/.ssh/mcipacker.pem
chmod 0600 ~/.ssh/mcipacker.pem