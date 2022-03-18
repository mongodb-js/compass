import store from './';

describe('CompassFindInPageStore [Store]', () => {
  it("should have an initial state of {status: 'enabled'}", () => {
    expect(store.getState()).to.be.deep.equal({
      searching: false,
      searchTerm: '',
      enabled: false,
    });
  });
});
