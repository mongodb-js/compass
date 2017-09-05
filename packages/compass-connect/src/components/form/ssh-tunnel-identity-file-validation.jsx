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
    if (!connection.last_used && !this.isSSHTunnelPortChanged &&
        connection.ssh_tunnel_port === DEFAULT_SSH_TUNNEL_PORT) {
      return '';
    }
    return connection.ssh_tunnel_port;
  }

  getHostnameError() {
    if (this._isInvalid(this.props.currentConnection.ssh_tunnel_hostname)) {
      return 'SSH hostname is required';
    }
  }

  getPortError() {
    if (this._isInvalid(this.props.currentConnection.ssh_tunnel_port)) {
      return 'SSH tunnel port is required';
    }
  }

  getUsernameError() {
    if (this._isInvalid(this.props.currentConnection.ssh_tunnel_username)) {
      return 'SSH username is required';
    }
  }

  getFileError() {
    if (this._isInvalid(this.props.currentConnection.ssh_tunnel_identity_file)) {
      return 'SSH identity file is required';
    }
  }

  _isInvalid(field) {
    return !this.props.isValid && isEmpty(field);
  }

  render() {
    return (
      <FormGroup id="ssh_tunnel_identity_file_validation">
        <FormInput
          label="SSH Hostname"
          name="ssh_tunnel_hostname"
          error={this.getHostnameError()}
          changeHandler={this.onSSHTunnelHostnameChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_hostname || ''}
          linkHandler={this.onSourceHelp.bind(this)} />
        <FormInput
          label="SSH Tunnel Port"
          name="ssh_tunnel_port"
          placeholder="22"
          error={this.getPortError()}
          changeHandler={this.onSSHTunnelPortChanged.bind(this)}
          value={this.getPort()} />
        <FormInput
          label="SSH Username"
          name="ssh_tunnel_username"
          error={this.getUsernameError()}
          changeHandler={this.onSSHTunnelUsernameChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_username || ''} />
        <FormFileInput
          label="SSH Identity File"
          id="ssh_tunnel_identity_file"
          error={this.getFileError()}
          changeHandler={this.onSSHTunnelIdentityFileChanged.bind(this)}
          values={this.props.currentConnection.ssh_tunnel_identity_file} />
        <FormInput
          label="SSH Passphrase"
          name="ssh_tunnel_passphrase"
          changeHandler={this.onSSHTunnelPassphraseChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_passphrase || ''} />
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
