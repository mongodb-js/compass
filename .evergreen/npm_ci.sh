#!/usr/bin/env bash

set -e

npm cache clean -f
#find . -not \( -path .deps -prune \) -name 'node_modules' -type d -prune -exec rm -rf '{}' +
npm ci --unsafe-perm