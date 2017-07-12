const expect = require('chai').expect;
const QueryHistoryStore = require('../../lib/stores');

describe('QueryHistoryStore', function() {
  beforeEach(function() {
    // reset the store to initial values
    QueryHistoryStore.setState(QueryHistoryStore.getInitialState());
  });

  it('should have an initial state of {status: \'enabled\'}', function() {
    expect(QueryHistoryStore.state.status).to.be.equal('enabled');
  });

  describe('toggleStatus()', function() {
    it('should switch the state to {status: \'disabled\'}', function() {
      QueryHistoryStore.toggleStatus();
      expect(QueryHistoryStore.state.status).to.be.equal('disabled');
    });

    it('should switch the state back to {status: \'enabled\'} when used a second time', function() {
      QueryHistoryStore.toggleStatus();
      QueryHistoryStore.toggleStatus();
      expect(QueryHistoryStore.state.status).to.be.equal('enabled');
    });
  });
});
