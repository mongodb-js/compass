const React = require('react');
const PropTypes = require('prop-types');
const AuthenticationSection = require('./authentication-section');
const HostPortSection = require('./host-port-section');
const ReplicaSetNameReadPreferenceSection = require('./replica-set-name-read-preference-section');

class Connect extends React.Component {

  render() {
    return (
      <div className="page connect">
        <div>
          <div className="sidebar panel"></div>
        </div>
        <div className="form-container">
          <header>
            <h2 data-test-id="connect-header">Connect to Host</h2>
          </header>
          <form data-test-id="connect-form">
            <HostPortSection {...this.props} />
            <hr />
            <AuthenticationSection {...this.props} />
            <hr />
            <ReplicaSetNameReadPreferenceSection {...this.props} />
            <hr />
          </form>
        </div>
      </div>
    );
  }
}

Connect.propTypes = {
  currentConnection: PropTypes.object
};

Connect.displayName = 'Connect';

module.exports = Connect;
