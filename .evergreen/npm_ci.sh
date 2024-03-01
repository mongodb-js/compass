#!/usr/bin/env bash

set -e

npm cache clean -f
rm -rf node_modules
find configs -name 'node_modules' -type d -prune -exec rm -rf '{}' +
find packages -name 'node_modules' -type d -prune -exec rm -rf '{}' +
find scripts -name 'node_modules' -type d -prune -exec rm -rf '{}' +
npm ci --unsafe-perm