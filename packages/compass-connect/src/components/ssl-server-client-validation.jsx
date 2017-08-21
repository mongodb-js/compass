const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
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

  render() {
    return (
      <div id="ssl-server-client-validation" className="form-group">
        <FormFileInput
          label="Certificate Authority"
          id="ssl_ca"
          changeHandler={this.onCertificateAuthorityChanged.bind(this)}
          values={this.props.currentConnection.ssl_ca}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities"
          multi />
        <FormFileInput
          label="Client Certificate"
          id="ssl_certificate"
          changeHandler={this.onClientCertificateChanged.bind(this)}
          values={this.props.currentConnection.ssl_certificate}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file" />
        <FormFileInput
          label="Client Private Key"
          id="ssl_private_key"
          changeHandler={this.onClientPrivateKeyChanged.bind(this)}
          values={this.props.currentConnection.ssl_private_key}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file" />
        <FormItemInput
          label="Client Key Password"
          name="ssl_private_key_password"
          changeHandler={this.onClientKeyPasswordChanged.bind(this)}
          value={this.props.currentConnection.ssl_private_key_password}
          link="https://docs.mongodb.com/manual/reference/configuration-options/#net.ssl.PEMKeyPassword" />
      </div>
    );
  }
}

SSLServerClientValidation.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

SSLServerClientValidation.displayName = 'SSLServerClientValidation';

module.exports = SSLServerClientValidation;
