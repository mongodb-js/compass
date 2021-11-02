import { shell } from 'electron';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { FileInput } from '@mongodb-js/compass-components';

import Actions from '../../actions';
import FormInput from './form-input';
import FormGroup from './form-group';

class SSHTunnelIdentityFileValidation extends React.Component {
  static displayName = 'SSHTunnelIdentityFileValidation';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
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
    Actions.onSSHTunnelPortChanged(evt.target.value);
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
    return this.props.connectionModel.sshTunnelPort;
  }

  /**
   * Checks if sshTunnelHostname is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getHostnameError() {
    if (this._isInvalid(this.props.connectionModel.sshTunnelHostname)) {
      return true;
    }
  }

  /**
   * Checks if sshTunnelPort is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getPortError() {
    if (this._isInvalid(this.props.connectionModel.sshTunnelPort)) {
      return true;
    }
  }

  /**
   * Checks if sshTunnelUsername is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getUsernameError() {
    if (this._isInvalid(this.props.connectionModel.sshTunnelUsername)) {
      return true;
    }
  }

  /**
   * Checks if sshTunnelIdentityFile is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getFileError() {
    if (this._isInvalid(this.props.connectionModel.sshTunnelIdentityFile)) {
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
          value={this.props.connectionModel.sshTunnelHostname || ''}
          linkHandler={this.onSourceHelp.bind(this)}
        />
        <FormInput
          label="SSH Tunnel Port"
          name="sshTunnelPort"
          placeholder="22"
          error={this.getPortError()}
          changeHandler={this.onSSHTunnelPortChanged.bind(this)}
          value={this.getPort()}
          type="number"
        />
        <FormInput
          label="SSH Username"
          name="sshTunnelUsername"
          error={this.getUsernameError()}
          changeHandler={this.onSSHTunnelUsernameChanged.bind(this)}
          value={this.props.connectionModel.sshTunnelUsername || ''}
        />
        <FileInput
          label="SSH Identity File"
          id="sshTunnelIdentityFile"
          error={this.getFileError()}
          onChange={this.onSSHTunnelIdentityFileChanged.bind(this)}
          values={this.props.connectionModel.sshTunnelIdentityFile}
        />
        <FormInput
          label="SSH Passphrase"
          name="sshTunnelPassphrase"
          type="password"
          changeHandler={this.onSSHTunnelPassphraseChanged.bind(this)}
          value={this.props.connectionModel.sshTunnelPassphrase || ''}
        />
      </FormGroup>
    );
  }
}

export default SSHTunnelIdentityFileValidation;
