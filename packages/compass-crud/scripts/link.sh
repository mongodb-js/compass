#!/bin/bash
PLUGIN_DIR=${PWD}
PLUGIN_NAME=${PWD##*/}
cd ${COMPASS_HOME}/node_modules/hadron-app
npm link
cd ${COMPASS_HOME}/node_modules/react
npm link
cd ${PLUGIN_DIR}
npm link hadron-app
npm link react
npm link
cd ${COMPASS_HOME}
npm link @mongodb-js/${PLUGIN_NAME}
