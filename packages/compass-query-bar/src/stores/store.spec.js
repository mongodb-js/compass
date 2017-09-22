import Store from 'stores';

describe('QueryBarStore [Store]', () => {
  beforeEach(function() {
    Store.setState( Store.getInitialState() );
  });

  it('should have an initial state of {status: \'enabled\'}', function() {
    expect(Store.state.status).to.be.equal('enabled');
  });

  describe('toggleStatus()', function() {
    it('should switch the state to {status: \'disabled\'}', function() {
      Store.toggleStatus();
      expect(Store.state.status).to.be.equal('disabled');
    });

    it('should switch the state back to {status: \'enabled\'} when used a second time', function() {
      Store.toggleStatus();
      Store.toggleStatus();
      expect(Store.state.status).to.be.equal('enabled');
    });
  });
});
