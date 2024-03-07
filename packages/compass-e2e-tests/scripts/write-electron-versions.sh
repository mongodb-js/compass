#!/usr/bin/env bash

echo "const fs = require('fs'); fs.writeFileSync('electron-versions.json', JSON.stringify(process.versions), 'utf8');" | npx electron -i