#!/usr/bin/env bash

# What version of the kernel to download
# and use when running tests.
# @see http://npm.im/mongodb-version-manager
export MONGODB_VERSION='unstable';

# Topology of the kernel to test against.
#
#   standalone|replicaset|cluster
#
# @see http://npm.im/mongodb-runner
export MONGODB_TOPOLOGY='replicaset';

rm -rf ~/scout-ci;
mkdir -p ~/scout-ci;
cd ~/scout-ci;

# First test the connection-model which is the basis.
# it provides a gaurantee to everything else that
# it will talk to the driver correctly.
# If we're talking to the driver correctly,
# the driver has already been heavily tested
# for all auth scenarios.
git clone git@github.com:mongodb-js/mongodb-connection-model.git;
cd mongodb-connection-model;
npm link && npm test;
cd ../;

# Is scout-server using connection-model correctly?
git clone git@github.com:10gen/scout-server.git;
cd scout-server;
git checkout -t origin/auth;
npm install;
npm link mongodb-connection-model;
npm test;
npm link;
cd ../;

# Is the client using the connection-model
# correctly when talking to the server?
git clone git@github.com:10gen/scout-client.git;
cd scout-client;
git checkout -t origin/auth;
npm link;
npm link scout-server;
npm link mongodb-connection-model;
npm test;

# @todo (imlucas): Is the connection dialog in Compass
# and the app in general using scout-client correctly?
# 1. Pulls the branch for compass
# 2. build it
# 3. npm link's the deps above
# 4. fires up `chromedriver`
# 5. fill in connect dialog with creds for each test deployment on Cloud Manager
# 6. do we get a list of namespaces after connecting
