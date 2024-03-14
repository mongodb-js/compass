#!/usr/bin/env bash

# To get the versions of various electron dependencies, including chromium we're
# mostly interested in, we run a script file using currently installed electron
# version binary. We don't use interactive electron repl (electron -i) here
# instead because Windows doesn't support it.
script="
const fs = require('fs');
fs.writeFileSync(
  'electron-versions.json',
  JSON.stringify(process.versions),
  'utf8'
);
process.exit();
"
script_name=write-electron-versions.js
echo $script >$script_name
npx electron --no-sandbox $script_name
