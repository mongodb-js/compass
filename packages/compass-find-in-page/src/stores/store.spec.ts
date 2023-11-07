import { expect } from 'chai';
import { activatePlugin } from './store';

describe('CompassFindInPageStore [Store]', function () {
  it("should have an initial state of {status: 'enabled'}", function () {
    const { store } = activatePlugin();
    expect(store.getState()).to.be.deep.equal({
      searching: false,
      searchTerm: '',
      enabled: false,
    });
  });
});
