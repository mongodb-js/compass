const expect = require('chai').expect;
const CompassCrudStore = require('../../lib/stores');

describe('CompassCrudStore', function() {
  beforeEach(function() {
    // reset the store to initial values
    CompassCrudStore.setState(CompassCrudStore.getInitialState());
  });

  it('should have an initial state of {status: \'enabled\'}', function() {
    expect(CompassCrudStore.state.status).to.be.equal('enabled');
  });

  describe('toggleStatus()', function() {
    it('should switch the state to {status: \'disabled\'}', function() {
      CompassCrudStore.toggleStatus();
      expect(CompassCrudStore.state.status).to.be.equal('disabled');
    });

    it('should switch the state back to {status: \'enabled\'} when used a second time', function() {
      CompassCrudStore.toggleStatus();
      CompassCrudStore.toggleStatus();
      expect(CompassCrudStore.state.status).to.be.equal('enabled');
    });
  });
});
