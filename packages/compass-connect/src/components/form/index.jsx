const React = require('react');
const PropTypes = require('prop-types');
const FormGroup = require('./form-group');
const HostInput = require('./host-input');
const PortInput = require('./port-input');
const SRVInput = require('./srv-input');
const Authentication = require('./authentication');
const ReplicaSetNameInput = require('./replica-set-name-input');
const ReadPreferenceSelect = require('./read-preference-select');
const SSL = require('./ssl');
const SSHTunnel = require('./ssh-tunnel');
const FormActions = require('./form-actions');

class ConnectForm extends React.Component {

  renderPort() {
    if (!this.props.currentConnection.isSrvRecord) {
      return (
        <PortInput
          lastUsed={this.props.currentConnection.last_used}
          port={this.props.currentConnection.port} />
      );
    }
  }

  render() {
    return (
      <form data-test-id="connect-form">
        <FormGroup id="host-port" separator>
          <HostInput
            lastUsed={this.props.currentConnection.last_used}
            hostname={this.props.currentConnection.hostname} />
          {this.renderPort()}
          <SRVInput isSrvRecord={this.props.currentConnection.isSrvRecord} />
        </FormGroup>
        <Authentication {...this.props} />
        <FormGroup id="read-preference" separator>
          <ReplicaSetNameInput
            sshTunnel={this.props.currentConnection.ssh_tunnel}
            replicaSetName={this.props.currentConnection.replica_set_name} />
          <ReadPreferenceSelect {...this.props} />
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
