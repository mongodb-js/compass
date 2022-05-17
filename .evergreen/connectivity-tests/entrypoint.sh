#!/usr/bin/env bash

set -e
echo "---- HOSTS: ----"
cat /etc/hosts
echo "----------------"

echo "running kinit"
echo 'password' | kinit mongodb.user@EXAMPLE.COM
echo
echo "klist:"
klist
echo

echo "Running 'npm run test-connectivity --workspace mongodb-data-service' in ${PWD}"
npm run test-connectivity --workspace mongodb-data-service