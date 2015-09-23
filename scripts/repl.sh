#!/usr/bin/env bash
cd ./dist/MongoDB\ Compass-darwin-x64/MongoDB\ Compass.app/Contents/Resources/app;
npm install --log-level error;

DEBUG='*' \
  ATOM_SHELL_INTERNAL_RUN_AS_NODE=1 \
  ../../MacOS/Electron \
  -e "require('repl').start({terminal: true, prompt: 'compass> '});";
