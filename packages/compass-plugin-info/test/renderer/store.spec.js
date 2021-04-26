/*
 * Place tests that must run in a renderer context inside Electron here.
 *
 * Note: The tests below are just a copy of the store unit tests as an example.
 * More complex plugins will require actual renderer/integration tests to be
 * executed here.
 */

import Store from 'stores';

describe('SecurityStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  it('defaults isVisible to false', () => {
    expect(Store.state.isVisible).to.equal(false);
  });
});
