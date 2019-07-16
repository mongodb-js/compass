const React = require('react');
const PropTypes = require('prop-types');
const isEmpty = require('lodash.isempty');
const Actions = require('../../actions');
const { FormInput } = require('hadron-react-components');
const { shell } = require('electron');

class MongoDBAuthentication extends React.Component {
  onUsernameChanged(evt) {
    Actions.onUsernameChanged(evt.target.value);
  }

  onPasswordChanged(evt) {
    Actions.onPasswordChanged(evt.target.value);
  }

  onAuthSourceChanged(evt) {
    Actions.onAuthSourceChanged(evt.target.value);
  }

  onSourceHelp() {
    shell.openExternal('https://docs.mongodb.com/manual/core/security-users/#user-authentication-database');
  }

  getUsernameError() {
    const connection = this.props.currentConnection;
    if (!this.props.isValid && isEmpty(connection.mongodbUsername)) {
      return 'Username is required';
    }
  }

  getPasswordError() {
    const connection = this.props.currentConnection;
    if (!this.props.isValid && isEmpty(connection.mongodbPassword)) {
      return 'Password is required';
    }
  }

  render() {
    return (
      <div id="mongodb-authentication" className="form-group">
        <FormInput
          label="Username"
          name="username"
          error={this.getUsernameError()}
          changeHandler={this.onUsernameChanged.bind(this)}
          value={this.props.currentConnection.mongodbUsername || ''} />
        <FormInput
          label="Password"
          name="password"
          type="password"
          error={this.getPasswordError()}
          changeHandler={this.onPasswordChanged.bind(this)}
          value={this.props.currentConnection.mongodbPassword || ''} />
        <FormInput
          label="Authentication Database"
          placeholder="admin"
          name="auth-source"
          changeHandler={this.onAuthSourceChanged.bind(this)}
          value={this.props.currentConnection.mongodbDatabaseName || ''}
          linkHandler={this.onSourceHelp.bind(this)}/>
      </div>
    );
  }
}

MongoDBAuthentication.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  isValid: PropTypes.bool
};

MongoDBAuthentication.displayName = 'MongoDBAuthentication';

module.exports = MongoDBAuthentication;
