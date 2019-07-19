import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash.isempty';
import Actions from 'actions';
import { FormInput } from 'hadron-react-components';
import { shell } from 'electron';
import FormGroup from './form-group';

const DEFAULT_SSH_TUNNEL_PORT = 22;

class SSHTunnelPasswordValidation extends React.Component {
  static displayName = 'SSHTunnelPasswordValidation';

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
   * Handles sshTunnelPassword change.
   *
   * @param {Object} evt - evt.
   */
  onSSHTunnelPasswordChanged(evt) {
    Actions.onSSHTunnelPasswordChanged(evt.target.value);
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
  onHostnameHelp() {
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
   * Checks if sshTunnelPassword is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getPasswordError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelPassword)) {
      return 'SSH password is required';
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

export default SSHTunnelPasswordValidation;
