const React = require('react');
const PropTypes = require('prop-types');
const isEmpty = require('lodash.isempty');
const { FormInput } = require('hadron-react-components');
const { shell } = require('electron');
const Actions = require('../../actions');
const FormGroup = require('./form-group');

const DEFAULT_SSH_TUNNEL_PORT = 22;

class SSHTunnelPasswordValidation extends React.Component {
  constructor(props) {
    super(props);
    this.isSSHTunnelPortChanged = false;
  }

  onSSHTunnelHostnameChanged(evt) {
    Actions.onSSHTunnelHostnameChanged(evt.target.value);
  }

  onSSHTunnelUsernameChanged(evt) {
    Actions.onSSHTunnelUsernameChanged(evt.target.value);
  }

  onSSHTunnelPasswordChanged(evt) {
    Actions.onSSHTunnelPasswordChanged(evt.target.value);
  }

  onSSHTunnelPortChanged(evt) {
    const value = evt.target.value;

    if (value === '') {
      this.isSSHTunnelPortChanged = false;
    } else {
      this.isSSHTunnelPortChanged = true;
    }

    Actions.onSSHTunnelPortChanged(value);
  }

  onHostnameHelp() {
    shell.openExternal('https://docs.mongodb.com/compass/current/connect');
  }

  getPort() {
    const connection = this.props.currentConnection;

    if (
      !connection.lastUsed && !this.isSSHTunnelPortChanged &&
      connection.sshTunnelPort === DEFAULT_SSH_TUNNEL_PORT
    ) {
      return '';
    }

    return connection.sshTunnelPort;
  }

  getHostnameError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelHostname)) {
      return 'SSH hostname is required';
    }
  }

  getPortError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelPort)) {
      return 'SSH tunnel port is required';
    }
  }

  getUsernameError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelUsername)) {
      return 'SSH username is required';
    }
  }

  getPasswordError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelPassword)) {
      return 'SSH password is required';
    }
  }

  _isInvalid(field) {
    return !this.props.isValid && isEmpty(field);
  }

  render() {
    return (
      <FormGroup id="sshTunnelPassword">
        <FormInput
          label="SSH Hostname"
          name="sshTunnelHostname"
          error={this.getHostnameError()}
          changeHandler={this.onSSHTunnelHostnameChanged.bind(this)}
          value={this.props.currentConnection.sshTunnelHostname || ''}
          linkHandler={this.onHostnameHelp.bind(this)} />
        <FormInput
          label="SSH Tunnel Port"
          name="sshTunnelPort"
          error={this.getPortError()}
          changeHandler={this.onSSHTunnelPortChanged.bind(this)}
          value={this.getPort()} />
        <FormInput
          label="SSH Username"
          name="sshTunnelUsername"
          error={this.getUsernameError()}
          changeHandler={this.onSSHTunnelUsernameChanged.bind(this)}
          value={this.props.currentConnection.sshTunnelUsername || ''} />
        <FormInput
          label="SSH Password"
          name="sshTunnelPassword"
          type="password"
          error={this.getPasswordError()}
          changeHandler={this.onSSHTunnelPasswordChanged.bind(this)}
          value={this.props.currentConnection.sshTunnelPassword || ''} />
      </FormGroup>
    );
  }
}

SSHTunnelPasswordValidation.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  isValid: PropTypes.bool
};

SSHTunnelPasswordValidation.displayName = 'SSHTunnelPasswordValidation';

module.exports = SSHTunnelPasswordValidation;
