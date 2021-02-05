import classnames from 'classnames';
import { shell } from 'electron';
import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

import Actions from '../../actions';
import FormInput from './form-input';
import FormFileInput from './form-file-input';

import styles from '../connect.less';

class SSLServerClientValidation extends React.Component {
  static displayName = 'SSLServerClientValidation';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
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
    shell.openExternal(
      'https://docs.mongodb.com/manual/reference/configuration-options/#net.ssl.PEMKeyPassword'
    );
  }

  /**
   * Checks if sslCA is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getCertAuthError() {
    if (this._isInvalid(this.props.connectionModel.sslCA)) {
      return true;
    }
  }

  /**
   * Checks if sslCert is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getClientCertError() {
    if (this._isInvalid(this.props.connectionModel.sslCert)) {
      return true;
    }
  }

  /**
   * Checks if sslKey is invalid.
   *
   * @returns {String} In case of error returns an error message.
   */
  getClientKeyError() {
    if (this._isInvalid(this.props.connectionModel.sslKey)) {
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
      <div
        id="ssl-server-client-validation"
        className={classnames(styles['form-group'])}
      >
        <FormFileInput
          label="Certificate Authority"
          id="sslCA"
          error={this.getCertAuthError()}
          changeHandler={this.onCertificateAuthorityChanged.bind(this)}
          values={this.props.connectionModel.sslCA}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities"
          multi
        />
        <FormFileInput
          label="Client Certificate"
          id="sslCert"
          error={this.getClientCertError()}
          changeHandler={this.onClientCertificateChanged.bind(this)}
          values={this.props.connectionModel.sslCert}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file"
        />
        <FormFileInput
          label="Client Private Key"
          id="sslKey"
          error={this.getClientKeyError()}
          changeHandler={this.onClientPrivateKeyChanged.bind(this)}
          values={this.props.connectionModel.sslKey}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file"
        />
        <FormInput
          label="Client Key Password"
          name="sslPass"
          type="password"
          changeHandler={this.onClientKeyPasswordChanged.bind(this)}
          value={this.props.connectionModel.sslPass || ''}
          linkHandler={this.onPasswordHelp.bind(this)}
        />
      </div>
    );
  }
}

export default SSLServerClientValidation;
