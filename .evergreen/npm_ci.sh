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

# Will fail if versions of direct dependencies listed in package-lock are not
# matching versions defined in package.json file of any of the workspace
# packages. This command is very noisy when running from root with --all, store
# the output in a file that will be uploaded with rest of the logs
LS_ALL_STDOUT_FILE="$(npm config get cache)/_logs/$(date -u +"%Y-%m-%dT%H_%M_%SZ")-npm-ls-all.log"
echo "Validating dependencies with \`npm ls --all\`..."
(npm ls --all >$LS_ALL_STDOUT_FILE && echo "No mismatched dependency versions") || (echo ""; echo "The \`npm ls\` command failed with mismatched dependencies error. This usually means that the dependency versions listed in package.json are not matching dependencies resolved and recorded in package-lock.json. If you updated package.json files in your PR, inspect the error output and try to re-install offending dependncies to fix the package-lock file." && exit 1)
