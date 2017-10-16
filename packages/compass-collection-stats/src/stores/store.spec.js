import Store from 'stores';

describe('CollectionStatsStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  it('should have an initial state of {status: \'enabled\'}', () => {
    expect(Store.state.status).to.be.equal('enabled');
  });

  describe('toggleStatus()', () => {
    it('should switch the state to {status: \'disabled\'}', () => {
      Store.toggleStatus();
      expect(Store.state.status).to.be.equal('disabled');
    });

    it('should switch the state back to {status: \'enabled\'} when used a second time', () => {
      Store.toggleStatus();
      Store.toggleStatus();
      expect(Store.state.status).to.be.equal('enabled');
    });
  });
});
