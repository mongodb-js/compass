/* eslint-disable */
'use strict';
const net = require('net');
const fs = require('fs');
const pidfile = process.argv[process.argv.indexOf('--pidfilepath') + 1];

let connections = 0;
const server = net.createServer(socket => {
  connections++;
  fs.writeFileSync(pidfile, JSON.stringify({ pid: process.pid, connections }));
  const proxied = net.connect(+process.env.MONGOSH_TEST_PROXY_TARGET_PORT);
  socket.pipe(proxied).pipe(socket);
});
server.listen(0, () => {
  console.log(`{"c":"NETWORK","id":23016,"ctx":"listener","attr":{"port":${server.address().port}}}`);
});
