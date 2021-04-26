// eslint-disable-next-line strict
'use strict';
const tls = require('tls');
const net = require('net');
const v8 = require('v8');

const sources = v8.deserialize(Buffer.from(process.env.REDIRECT_NETWORK_SOURCES, 'base64'));
const target = process.env.REDIRECT_NETWORK_TARGET.split(':');

for (const mod of [ tls, net ]) {
  const originalConnect = mod.connect;
  mod.connect = (...args) => {
    // Signatures:
    // connect(opts, cb)
    // connect(path, cb)
    // connect(port[, host][, cb])
    // connect(path[, options][, cb])
    // connect(port[, host][, options][, cb])
    if (typeof args[0] === 'number' && typeof args[1] === 'string') {
      const hostport = { host: args[1], port: args[0] };
      if (typeof args[2] === 'object') {
        args.splice(0, 2);
        args[0] = { ...args[0], ...hostport };
      } else {
        args.splice(0, 2, hostport);
      }
    }

    const host = args[0].host;
    if (host !== undefined && sources.some(source => source.test(host))) {
      args[0].host = target[0];
      args[0].port = +target[1];
      return net.connect(...args);
    }
    return originalConnect(...args);
  };
}
