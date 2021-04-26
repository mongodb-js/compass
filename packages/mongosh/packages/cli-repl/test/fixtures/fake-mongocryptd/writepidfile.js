/* eslint-disable */
'use strict';
const fs = require('fs');
const pidfile = process.argv[process.argv.indexOf('--pidfilepath') + 1];

fs.writeFileSync(pidfile, JSON.stringify({
  pid: process.pid,
  args: process.argv
}));
console.log('{"t":{"$date":"2021-03-29T18:48:32.518+02:00"},"s":"I","c":"NETWORK","id":23016,"ctx":"listener","msg":"Waiting for connections","attr":{"port":27020,"ssl":"off"}}');

setInterval(() => {}, 1000);
