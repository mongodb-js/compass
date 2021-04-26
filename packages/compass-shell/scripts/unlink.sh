#!/bin/bash
PLUGIN_DIR=${PWD}
PLUGIN_NAME=${PWD##*/}
npm unlink react
cd ${COMPASS_HOME}/node_modules/react
npm unlink
cd ${COMPASS_HOME}
npm unlink @mongodb-js/${PLUGIN_NAME}
cd ${PLUGIN_DIR}
npm unlink
