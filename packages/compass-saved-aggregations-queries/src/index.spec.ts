// this is to avoid BigInteger is not defined error, which is thrown in ipv6/lib/node/bigint.js
// import chain: compass-query-history -> mongodb-data-service -> ssh-tunnel -> socksv5 -> ipv6 (which is pretty old and deprecated).
globalThis.BigInteger = undefined;

import { expect } from 'chai';
import * as CompassPlugin from './index';

describe('Compass Plugin', function () {
  it('exports activate, deactivate, and metadata', function () {
    expect(CompassPlugin).to.have.property('activate');
    expect(CompassPlugin).to.have.property('deactivate');
    expect(CompassPlugin).to.have.property('metadata');
  });
});
