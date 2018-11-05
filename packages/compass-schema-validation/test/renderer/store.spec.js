/*
 * Place tests that must run in a renderer context inside Electron here.
 *
 * Note: The tests below are just a copy of the store unit tests as an example.
 * More complex plugins will require actual renderer/integration tests to be
 * executed here.
 */

import Store from 'stores';

describe('CompassJsonSchemaValidationStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  it('should have an initial state of {status: \'enabled\'}', () => {
    expect(Store.state.status).to.equal('enabled');
  });

  describe('toggleStatus()', () => {
    it('should switch the state to {status: \'disabled\'}', () => {
      Store.toggleStatus();
      expect(Store.state.status).to.equal('disabled');
    });

    it('should switch the state back to {status: \'enabled\'} when used a second time', () => {
      Store.toggleStatus();
      Store.toggleStatus();
      expect(Store.state.status).to.equal('enabled');
    });
  });
});
