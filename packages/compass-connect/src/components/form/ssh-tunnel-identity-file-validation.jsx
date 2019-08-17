import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash.isempty';
import Actions from 'actions';
import FormInput from './form-input';
import { shell } from 'electron';
import FormFileInput from './form-file-input';
import FormGroup from './form-group';

const DEFAULT_SSH_TUNNEL_PORT = 22;

class SSHTunnelIdentityFileValidation extends React.Component {
  static displayName = 'SSHTunnelIdentityFileValidation';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    isValid: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.isSSHTunnelPortChanged = false;
  }

  /**
   * Handles sshTunnelHostname change.
   *
   * @param {Object} evt - evt.
   */
  onSSHTunnelHostnameChanged(evt) {
    Actions.onSSHTunnelHostnameChanged(evt.target.value);
  }

  /**
   * Handles sshTunnelUsername change.
   *
   * @param {Object} evt - evt.
   */
  onSSHTunnelUsernameChanged(evt) {
    Actions.onSSHTunnelUsernameChanged(evt.target.value);
  }

  /**
   * Handles sshTunnelIdentityFile change.
   *
   * @param {Object} evt - evt.
   */
  onSSHTunnelIdentityFileChanged(evt) {
    Actions.onSSHTunnelIdentityFileChanged(evt);
  }

  /**
   * Handles sshTunnelPassphrase change.
   *
   * @param {Object} evt - evt.
   */
  onSSHTunnelPassphraseChanged(evt) {
    Actions.onSSHTunnelPassphraseChanged(evt.target.value);
  }

  /**
   * Handles sshTunnelPort change.
   *
   * @param {Object} evt - evt.
   */
  onSSHTunnelPortChanged(evt) {
    const value = evt.target.value;

    if (value === '') {
      this.isSSHTunnelPortChanged = false;
    } else {
      this.isSSHTunnelPortChanged = true;
    }

    Actions.onSSHTunnelPortChanged(value);
  }

  /**
   * Opens "Connect to MongoDB" documentation.
   */
  onSourceHelp() {
    shell.openExternal('https://docs.mongodb.com/compass/current/connect');
  }

  /**
   * Gets current sshTunnelPort.
   *
   * @returns {Number} sshTunnelPort.
   */
  getPort() {
    const connection = this.props.currentConnection;

    if (
      !connection.lastUsed &&
      !this.isSSHTunnelPortChanged &&
      (connection.sshTunnelPort === DEFAULT_SSH_TUNNEL_PORT)
    ) {
      return '';
    }

    return connection.sshTunnelPort;
  }

  /**
   * Checks if sshTunnelHostname is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getHostnameError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelHostname)) {
      return 'SSH hostname is required';
    }
  }

  /**
   * Checks if sshTunnelPort is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getPortError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelPort)) {
      return 'SSH tunnel port is required';
    }
  }

  /**
   * Checks if sshTunnelUsername is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getUsernameError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelUsername)) {
      return 'SSH username is required';
    }
  }

  /**
   * Checks if sshTunnelIdentityFile is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getFileError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelIdentityFile)) {
      return 'SSH identity file is required';
    }
  }

  /**
   * Checks if a field is valid and is not empty.
   *
   * @param {String} field - A field that should be validated.
   *
   * @returns {Boolean}
   */
  _isInvalid(field) {
    return (!this.props.isValid && isEmpty(field));
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

export default SSHTunnelIdentityFileValidation;
