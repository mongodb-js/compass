const React = require('react');
const PropTypes = require('prop-types');
const isEmpty = require('lodash.isempty');
const Actions = require('../../actions');
const FormFileInput = require('./form-file-input');
const { FormInput } = require('hadron-react-components');
const { shell } = require('electron');

class SSLServerClientValidation extends React.Component {
  onCertificateAuthorityChanged(paths) {
    Actions.onSSLCAChanged(paths);
  }

  onClientCertificateChanged(paths) {
    Actions.onSSLCertificateChanged(paths);
  }

  onClientPrivateKeyChanged(paths) {
    Actions.onSSLPrivateKeyChanged(paths);
  }

  onClientKeyPasswordChanged(evt) {
    Actions.onSSLPrivateKeyPasswordChanged(evt.target.value);
  }

  onPasswordHelp() {
    shell.openExternal('https://docs.mongodb.com/manual/reference/configuration-options/#net.ssl.PEMKeyPassword');
  }

  getCertAuthError() {
    if (this._isInvalid(this.props.currentConnection.sslCA)) {
      return 'Certificate authority is required';
    }
  }

  getClientCertError() {
    if (this._isInvalid(this.props.currentConnection.sslCert)) {
      return 'Client certificate is required';
    }
  }

  getClientKeyError() {
    if (this._isInvalid(this.props.currentConnection.sslKey)) {
      return 'Client private key is required';
    }
  }

  _isInvalid(field) {
    return !this.props.isValid && isEmpty(field);
  }

  render() {
    return (
      <div id="ssl-server-client-validation" className="form-group">
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

SSLServerClientValidation.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  isValid: PropTypes.bool
};

SSLServerClientValidation.displayName = 'SSLServerClientValidation';

module.exports = SSLServerClientValidation;
