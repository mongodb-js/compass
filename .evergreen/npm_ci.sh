#!/usr/bin/env bash

set -e

# Remove the cache and any potential install leftovers before installing again.
# We are running this script with a retry to deal with network issues, in some
# rare cases npm leaves stuff behind messing up a new attempt
rm -rf "$NPM_CACHE_DIR"
rm -rf node_modules
find configs -name 'node_modules' -type d -prune -exec rm -rf '{}' +
find packages -name 'node_modules' -type d -prune -exec rm -rf '{}' +
find scripts -name 'node_modules' -type d -prune -exec rm -rf '{}' +
npm ci --unsafe-perm
