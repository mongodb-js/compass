const expect = require('chai').expect;
const DeploymentAwarenessStore = require('../../lib/stores');

describe('DeploymentAwarenessStore', function() {
  beforeEach(function() {
    // reset the store to initial values
    DeploymentAwarenessStore.setState(DeploymentAwarenessStore.getInitialState());
  });

  it('should have an initial state of {status: \'enabled\'}', function() {
    expect(DeploymentAwarenessStore.state.status).to.be.equal('enabled');
  });

  describe('toggleStatus()', function() {
    it('should switch the state to {status: \'disabled\'}', function() {
      DeploymentAwarenessStore.toggleStatus();
      expect(DeploymentAwarenessStore.state.status).to.be.equal('disabled');
    });

    it('should switch the state back to {status: \'enabled\'} when used a second time', function() {
      DeploymentAwarenessStore.toggleStatus();
      DeploymentAwarenessStore.toggleStatus();
      expect(DeploymentAwarenessStore.state.status).to.be.equal('enabled');
    });
  });
});
