#!/usr/bin/env node

var child_process = require('child_process');
var path = require('path');
var SERVER_BIN = path.resolve(__dirname + '/../../scout-server/bin/scout-server.js');
var PID_FILE = path.resolve(__dirname + '/scout-server.pid');
var fs = require('fs');


if(fs.existsSync(PID_FILE)){
  var existing = parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);
  console.log('killing existing pid', existing);
  try{
    process.kill(existing, 'SIGKILL');
  }
  catch(e){
    console.log('proc already gone away');
  }
}
var server = child_process.fork(SERVER_BIN);
console.log('spawned', server);
fs.writeFileSync(PID_FILE, server.pid);
process.exit(0);
