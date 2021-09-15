/* global __non_webpack_require__ */
/* eslint-disable camelcase */
// XXX: This is needed to that hadron-plugin-manager can function both in
// node/electron and webpack runtime
module.exports =
  typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
