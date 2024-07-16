import { expect } from 'chai';
import { activatePlugin } from './store';
import { AppRegistry } from 'hadron-app-registry';

describe('CompassFindInPageStore [Store]', function () {
  it("should have an initial state of {status: 'enabled'}", function () {
    const { store } = activatePlugin(
      {},
      {
        globalAppRegistry: new AppRegistry(),
      }
    );
    expect(store.getState()).to.be.deep.equal({
      searching: false,
      searchTerm: '',
      enabled: false,
    });
  });
});
