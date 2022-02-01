// this is to avoid BigInteger is not defined error, which is thrown in ipv6/lib/node/bigint.js
// import chain: compass-query-history -> mongodb-data-service -> ssh-tunnel -> socksv5 -> ipv6 (which is pretty old and deprecated).
globalThis.BigInteger = undefined;
