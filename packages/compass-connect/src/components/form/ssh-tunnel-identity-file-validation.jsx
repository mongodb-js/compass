const React = require('react');
const PropTypes = require('prop-types');
const { FormInput } = require('hadron-react-components');
const { shell } = require('electron');
const isEmpty = require('lodash.isempty');
const Actions = require('../../actions');
const FormFileInput = require('./form-file-input');
const FormGroup = require('./form-group');

const DEFAULT_SSH_TUNNEL_PORT = 22;

class SSHTunnelIdentityFileValidation extends React.Component {
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

  onSSHTunnelIdentityFileChanged(paths) {
    Actions.onSSHTunnelIdentityFileChanged(paths);
  }

  onSSHTunnelPassphraseChanged(evt) {
    Actions.onSSHTunnelPassphraseChanged(evt.target.value);
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

  onSourceHelp() {
    shell.openExternal('https://docs.mongodb.com/compass/current/connect');
  }

  getPort() {
    const connection = this.props.currentConnection;

    if (!connection.lastUsed && !this.isSSHTunnelPortChanged &&
        connection.sshTunnelPort === DEFAULT_SSH_TUNNEL_PORT) {
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

  getFileError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelIdentityFile)) {
      return 'SSH identity file is required';
    }
  }

  _isInvalid(field) {
    return !this.props.isValid && isEmpty(field);
  }

  render() {
    return (
      <FormGroup id="sshTunnelIdentityFileValidation">
        <FormInput
          label="SSH Hostname"
          name="sshTunnelHostname"
          error={this.getHostnameError()}
          changeHandler={this.onSSHTunnelHostnameChanged.bind(this)}
          value={this.props.currentConnection.sshTunnelHostname || ''}
          linkHandler={this.onSourceHelp.bind(this)} />
        <FormInput
          label="SSH Tunnel Port"
          name="sshTunnelPort"
          placeholder="22"
          error={this.getPortError()}
          changeHandler={this.onSSHTunnelPortChanged.bind(this)}
          value={this.getPort()} />
        <FormInput
          label="SSH Username"
          name="sshTunnelUsername"
          error={this.getUsernameError()}
          changeHandler={this.onSSHTunnelUsernameChanged.bind(this)}
          value={this.props.currentConnection.sshTunnelUsername || ''} />
        <FormFileInput
          label="SSH Identity File"
          id="sshTunnelIdentityFile"
          error={this.getFileError()}
          changeHandler={this.onSSHTunnelIdentityFileChanged.bind(this)}
          values={this.props.currentConnection.sshTunnelIdentityFile} />
        <FormInput
          label="SSH Passphrase"
          name="sshTunnelPassphrase"
          type="password"
          changeHandler={this.onSSHTunnelPassphraseChanged.bind(this)}
          value={this.props.currentConnection.sshTunnelPassphrase || ''} />
      </FormGroup>
    );
  }
}

SSHTunnelIdentityFileValidation.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  isValid: PropTypes.bool
};

SSHTunnelIdentityFileValidation.displayName = 'SSHTunnelIdentityFileValidation';

module.exports = SSHTunnelIdentityFileValidation;
