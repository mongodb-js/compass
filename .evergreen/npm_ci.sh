#!/usr/bin/env bash

set -e

npm cache clean -f
find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
npm ci --unsafe-perm