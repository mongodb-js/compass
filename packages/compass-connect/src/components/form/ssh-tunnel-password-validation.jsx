import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash.isempty';
import Actions from 'actions';
import FormInput from './form-input';
import { shell } from 'electron';
import FormGroup from './form-group';

class SSHTunnelPasswordValidation extends React.Component {
  static displayName = 'SSHTunnelPasswordValidation';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    isValid: PropTypes.bool
  };

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
    Actions.onSSHTunnelUsernameChanged(evt.target.value.trim());
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
    Actions.onSSHTunnelPortChanged(evt.target.value);
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
    return this.props.currentConnection.sshTunnelPort;
  }

  /**
   * Checks if sshTunnelHostname is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getHostnameError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelHostname)) {
      return true;
    }
  }

  /**
   * Checks if sshTunnelPort is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getPortError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelPort)) {
      return true;
    }
  }

  /**
   * Checks if sshTunnelUsername is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getUsernameError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelUsername)) {
      return true;
    }
  }

  /**
   * Checks if sshTunnelPassword is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getPasswordError() {
    if (this._isInvalid(this.props.currentConnection.sshTunnelPassword)) {
      return true;
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
