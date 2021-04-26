#!/usr/bin/env node
/* eslint-disable strict, no-sync */
'use strict';
const AsyncWriter = require('../').default;
const fs = require('fs');
const input = fs.readFileSync(process.argv[2]);
const asyncWriter = new AsyncWriter();
process.stdout.write(asyncWriter.process(input));
