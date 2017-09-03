const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const FormFileInput = require('./form-file-input');

class SSLServerValidation extends React.Component {

  onSSLCAChanged(path) {
    Actions.onSSLCAChanged(path);
  }

  render() {
    return (
      <div id="ssl-server-validation" className="form-group">
        <FormFileInput
          label="Certificate Authority"
          changeHandler={this.onSSLCAChanged.bind(this)}
          values={this.props.currentConnection.ssl_ca}
          link="https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities"
          multi />
      </div>
    );
  }
}

SSLServerValidation.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

SSLServerValidation.displayName = 'SSLServerValidation';

module.exports = SSLServerValidation;
