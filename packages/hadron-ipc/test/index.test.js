'use strict';

const ipc = require('../');
const assert = require('assert');

describe('hadron-ipc', () => {
  it('should have a respondTo method', () => {
    assert(ipc.respondTo);
  });

  it('should have a broadcast method', () => {
    assert(ipc.broadcast);
  });

  it('has a broadcastFocused method', () => {
    assert(ipc.broadcastFocused);
  });
});
