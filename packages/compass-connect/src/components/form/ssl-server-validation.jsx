const React = require('react');
const PropTypes = require('prop-types');
const isEmpty = require('lodash.isempty');
const Actions = require('../../actions');
const FormFileInput = require('./form-file-input');

class SSLServerValidation extends React.Component {

  onSSLCAChanged(path) {
    Actions.onSSLCAChanged(path);
  }

  getError() {
    const connection = this.props.currentConnection;
    if (!this.props.isValid && isEmpty(connection.ssl_ca)) {
      return 'Certificate authority is required';
    }
  }

  render() {
    return (
      <div id="ssl-server-validation" className="form-group">
        <FormFileInput
          label="Certificate Authority"
          changeHandler={this.onSSLCAChanged.bind(this)}
          values={this.props.currentConnection.ssl_ca}
          error={this.getError()}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities"
          multi />
      </div>
    );
  }
}

SSLServerValidation.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  isValid: PropTypes.bool
};

SSLServerValidation.displayName = 'SSLServerValidation';

module.exports = SSLServerValidation;
