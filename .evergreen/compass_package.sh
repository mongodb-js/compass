#! /usr/bin/env bash

# For debugging any problems when the notary service fails.
# @see https://github.com/mongodb-js/notary-service-client For details on what notary service is.
export DEBUG=mongodb-notary*

# Required to sign release assets

echo "Creating signed release build..."

# Provide a verbose logging for the release process
# restore debug after overriding it above
export DEBUG=$DEFAULT_DEBUG

npm run package-compass $COMPASS_DISTRIBUTION;

ls -la packages/compass/dist