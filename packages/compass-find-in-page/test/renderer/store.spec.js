/*
 * Place tests that must run in a renderer context inside Electron here.
 *
 * Note: The tests below are just a copy of the store unit tests as an example.
 * More complex plugins will require actual renderer/integration tests to be
 * executed here.
 */

import Store from '../../src/stores';

describe('CompassFindInPageStore [Store]', () => {
  it('should have an initial state of initialized store', () => {
    expect(Store.getState()).to.deep.equal({
      searching: false,
      searchTerm: '',
      enabled: false
    });
  });
});
