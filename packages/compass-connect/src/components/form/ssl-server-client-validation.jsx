import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash.isempty';
import Actions from 'actions';
import FormInput from './form-input';
import { shell } from 'electron';
import FormFileInput from './form-file-input';
import classnames from 'classnames';

import styles from '../connect.less';

class SSLServerClientValidation extends React.Component {
  static displayName = 'SSLServerClientValidation';

  static propTypes = {
    currentConnection: PropTypes.object.isRequired,
    isValid: PropTypes.bool
  };

  /**
   * Handles sslCA change.
   *
   * @param {Object} evt - evt.
   */
  onCertificateAuthorityChanged(evt) {
    Actions.onSSLCAChanged(evt);
  }

  /**
   * Handles sslCert change.
   *
   * @param {Object} evt - evt.
   */
  onClientCertificateChanged(evt) {
    Actions.onSSLCertificateChanged(evt);
  }

  /**
   * Handles sslKey change.
   *
   * @param {Object} evt - evt.
   */
  onClientPrivateKeyChanged(evt) {
    Actions.onSSLPrivateKeyChanged(evt);
  }

  /**
   * Handles sslPass change.
   *
   * @param {Object} evt - evt.
   */
  onClientKeyPasswordChanged(evt) {
    Actions.onSSLPrivateKeyPasswordChanged(evt.target.value);
  }

  /**
   * Opens documentation about net.ssl.PEMKeyPassword.
   */
  onPasswordHelp() {
    shell.openExternal('https://docs.mongodb.com/manual/reference/configuration-options/#net.ssl.PEMKeyPassword');
  }

  /**
   * Checks if sslCA is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getCertAuthError() {
    if (this._isInvalid(this.props.currentConnection.sslCA)) {
      return 'Certificate authority is required';
    }
  }

  /**
   * Checks if sslCert is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getClientCertError() {
    if (this._isInvalid(this.props.currentConnection.sslCert)) {
      return 'Client certificate is required';
    }
  }

  /**
   * Checks if sslKey is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getClientKeyError() {
    if (this._isInvalid(this.props.currentConnection.sslKey)) {
      return 'Client private key is required';
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
      <div id="ssl-server-client-validation" className={classnames(styles['form-group'])}>
        <FormFileInput
          label="Certificate Authority"
          id="sslCA"
          error={this.getCertAuthError()}
          changeHandler={this.onCertificateAuthorityChanged.bind(this)}
          values={this.props.currentConnection.sslCA}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities"
          multi />
        <FormFileInput
          label="Client Certificate"
          id="sslCert"
          error={this.getClientCertError()}
          changeHandler={this.onClientCertificateChanged.bind(this)}
          values={this.props.currentConnection.sslCert}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file" />
        <FormFileInput
          label="Client Private Key"
          id="sslKey"
          error={this.getClientKeyError()}
          changeHandler={this.onClientPrivateKeyChanged.bind(this)}
          values={this.props.currentConnection.sslKey}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file" />
        <FormInput
          label="Client Key Password"
          name="sslPass"
          type="password"
          changeHandler={this.onClientKeyPasswordChanged.bind(this)}
          value={this.props.currentConnection.sslPass || ''}
          linkHandler={this.onPasswordHelp.bind(this)} />
      </div>
    );
  }
}

export default SSLServerClientValidation;
