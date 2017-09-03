const React = require('react');
const PropTypes = require('prop-types');
const isEmpty = require('lodash.isempty');
const Actions = require('../../actions');
const FormFileInput = require('./form-file-input');
const FormItemInput = require('./form-item-input');

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

  getCertAuthError() {
    const connection = this.props.currentConnection;
    if (!this.props.isValid && isEmpty(connection.ssl_ca)) {
      return 'Certificate authority is required';
    }
  }

  getClientCertError() {
    const connection = this.props.currentConnection;
    if (!this.props.isValid && isEmpty(connection.ssl_certificate)) {
      return 'Client certificate is required';
    }
  }

  getClientKeyError() {
    const connection = this.props.currentConnection;
    if (!this.props.isValid && isEmpty(connection.ssl_private_key)) {
      return 'Client private key is required';
    }
  }

  render() {
    return (
      <div id="ssl-server-client-validation" className="form-group">
        <FormFileInput
          label="Certificate Authority"
          id="ssl_ca"
          error={this.getCertAuthError()}
          changeHandler={this.onCertificateAuthorityChanged.bind(this)}
          values={this.props.currentConnection.ssl_ca}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities"
          multi />
        <FormFileInput
          label="Client Certificate"
          id="ssl_certificate"
          error={this.getClientCertError()}
          changeHandler={this.onClientCertificateChanged.bind(this)}
          values={this.props.currentConnection.ssl_certificate}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file" />
        <FormFileInput
          label="Client Private Key"
          id="ssl_private_key"
          error={this.getClientKeyError()}
          changeHandler={this.onClientPrivateKeyChanged.bind(this)}
          values={this.props.currentConnection.ssl_private_key}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file" />
        <FormItemInput
          label="Client Key Password"
          name="ssl_private_key_password"
          type="password"
          changeHandler={this.onClientKeyPasswordChanged.bind(this)}
          value={this.props.currentConnection.ssl_private_key_password || ''}
          link="https://docs.mongodb.com/manual/reference/configuration-options/#net.ssl.PEMKeyPassword" />
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
