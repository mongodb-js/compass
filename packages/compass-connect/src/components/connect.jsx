const React = require('react');
const FormConnectHostPort = require('./form-connect-host-port');
const FormReplicaSetNameReadPreference = require('./form-replica-set-name-read-preference');

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
            <FormConnectHostPort />
            <hr />
            <FormReplicaSetNameReadPreference />
            <hr />
          </form>
        </div>
      </div>
    );
  }
}

Connect.displayName = 'Connect';

module.exports = Connect;
