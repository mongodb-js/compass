#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var PID_FILE = path.resolve(__dirname + '/scout-server.pid');
var existing = parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);
console.log('killing existing pid', existing);
process.kill(existing, 'SIGTERM');

process.exit(0);
