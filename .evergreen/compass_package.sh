#! /usr/bin/env bash

echo "Creating signed release build..."
npm run package-compass $COMPASS_DISTRIBUTION;

ls -la packages/compass/dist