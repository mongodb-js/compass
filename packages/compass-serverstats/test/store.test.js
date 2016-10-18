const expect = require('chai').expect;
const CompassServerstatsStore = require('../lib/stores');

describe('CompassServerstatsStore', function() {
  beforeEach(function() {
    // reset the store to initial values
    CompassServerstatsStore.setState(CompassServerstatsStore.getInitialState());
  });

  it('should have an initial state of {status: \'enabled\'}', function() {
    expect(CompassServerstatsStore.state.status).to.be.equal('enabled');
  });

  describe('toggleStatus()', function() {
    it('should switch the state to {status: \'disabled\'}', function() {
      CompassServerstatsStore.toggleStatus();
      expect(CompassServerstatsStore.state.status).to.be.equal('disabled');
    });

    it('should switch the state back to {status: \'enabled\'} when used a second time', function() {
      CompassServerstatsStore.toggleStatus();
      CompassServerstatsStore.toggleStatus();
      expect(CompassServerstatsStore.state.status).to.be.equal('enabled');
    });
  });
});
