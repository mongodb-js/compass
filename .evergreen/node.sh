#!/usr/bin/env bash

if [ -n "$IS_OSX" ]; then
  ELECTRON_RUN_AS_NODE=1 exec $(dirname $0)/../Electron.app/Contents/MacOS/Electron "$@"
else
  # assume linux for now. Add windows later
  ELECTRON_RUN_AS_NODE=1 exec $(dirname $0)/../electron "$@"
fi