import Store from 'stores';

describe('LicenseStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  it('defaults to hidden', () => {
    expect(Store.state.isVisible).to.equal(false);
  });
});
