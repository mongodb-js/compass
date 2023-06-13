const dns = require('dns');

// https://github.com/nodejs/node/issues/40537
// TODO(NODE-4926): This is so that tests that try and connect to localhost will
// connect to 127.0.0.1 in node v18 and later.
dns.setDefaultResultOrder('ipv4first');
