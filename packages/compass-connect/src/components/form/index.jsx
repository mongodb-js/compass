const React = require('react');
const PropTypes = require('prop-types');
const FormGroup = require('./form-group');
const HostInput = require('./host-input');
const PortInput = require('./port-input');
const SRVInput = require('./srv-input');
const Authentication = require('./authentication');
const ReplicaSetInput = require('./replica-set-input');
const ReadPreferenceSelect = require('./read-preference-select');
const SSL = require('./ssl');
const SSHTunnel = require('./ssh-tunnel');
const FormActions = require('./form-actions');

class ConnectForm extends React.Component {
  renderPort() {
    if (!this.props.currentConnection.isSrvRecord) {
      return (
        <PortInput
          lastUsed={this.props.currentConnection.lastUsed}
          port={this.props.currentConnection.port} />
      );
    }
  }

  render() {
    return (
      <form data-test-id="connect-form">
        <FormGroup id="host-port" separator>
          <HostInput
            lastUsed={this.props.currentConnection.lastUsed}
            hostname={this.props.currentConnection.attributes.hostname} />
          {this.renderPort()}
          <SRVInput isSrvRecord={this.props.currentConnection.isSrvRecord} />
        </FormGroup>
        <Authentication {...this.props} />
        <FormGroup id="read-preference" separator>
          <ReplicaSetInput
            sshTunnel={this.props.currentConnection.sshTunnel}
            replicaSet={this.props.currentConnection.replicaSet} />
          <ReadPreferenceSelect readPreference={this.props.currentConnection.readPreference} />
        </FormGroup>
        <SSL {...this.props} />
        <SSHTunnel {...this.props} />
        <FormActions {...this.props } />
      </form>
    );
  }
}

ConnectForm.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

ConnectForm.displayName = 'ConnectForm';

module.exports = ConnectForm;
