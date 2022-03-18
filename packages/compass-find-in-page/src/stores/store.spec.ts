import { expect } from 'chai';

import store from './';

describe('CompassFindInPageStore [Store]', function () {
  it("should have an initial state of {status: 'enabled'}", function () {
    expect(store.getState()).to.be.deep.equal({
      searching: false,
      searchTerm: '',
      enabled: false,
    });
  });
});
