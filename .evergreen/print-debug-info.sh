#! /usr/bin/env bash

echo "========================="
echo "Important Environment Variables"
echo "========================="
echo "PLATFORM: $PLATFORM"
echo "ARCH: $ARCH"
echo "NODE_JS_VERSION: $NODE_JS_VERSION"
echo "NPM_VERSION: $NPM_VERSION"
echo "APPDATA: $APPDATA"
echo "PATH: $PATH"

# these are super useful if you want to run the smoke tests locally
echo "export DEV_VERSION_IDENTIFIER=$DEV_VERSION_IDENTIFIER"
echo "export EVERGREEN_BUCKET_KEY_PREFIX=$EVERGREEN_BUCKET_KEY_PREFIX"

echo "IS_OSX: $IS_OSX"
echo "IS_LINUX: $IS_LINUX"
echo "IS_WINDOWS: $IS_WINDOWS"
echo "IS_RHEL: $IS_RHEL"
echo "IS_UBUNTU: $IS_UBUNTU"

echo "DOCKER_CONFIG: $DOCKER_CONFIG"
