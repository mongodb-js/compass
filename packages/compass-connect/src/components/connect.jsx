const React = require('react');
const PropTypes = require('prop-types');
const AuthenticationSection = require('./authentication-section');
const HostPortSection = require('./host-port-section');
const ReplicaSetNameReadPreferenceSection = require('./replica-set-name-read-preference-section');
const SSLSection = require('./ssl-section');
const FavoriteSection = require('./favorite-section');
const Sidebar = require('./sidebar');

class Connect extends React.Component {

  render() {
    return (
      <div className="page connect">
        <Sidebar />
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
            <SSLSection {...this.props} />
            <hr />
            <FavoriteSection {...this.props } />
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
