// eslint-disable-next-line strict
'use strict';
const { default: AsyncWriter } = require('../../');
const domain = require('domain');
const vm = require('vm');

// This script should not enter an infinite loop. In the past, it did on
// Node.js < 14.15.2, because domains use Array.prototype.every when being
// entered, for which we provide a polyfill, which could lead to an async call
// because of the async wrapping, which in turn would lead to the domain being
// entered, and so on.

const d = domain.create();
const aw = new AsyncWriter();
d.run(() => {
  vm.runInThisContext(aw.runtimeSupportCode());
  return vm.runInThisContext('(async() => 42)()');
});
