const React = require('react');
const PropTypes = require('prop-types');
const isEmpty = require('lodash.isempty');
const Actions = require('../../actions');
const FormItemInput = require('./form-item-input');

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

  getUsernameError() {
    const connection = this.props.currentConnection;
    if (!this.props.isValid && isEmpty(connection.mongodb_username)) {
      return 'Username is required';
    }
  }

  getPasswordError() {
    const connection = this.props.currentConnection;
    if (!this.props.isValid && isEmpty(connection.mongodb_password)) {
      return 'Password is required';
    }
  }

  render() {
    return (
      <div id="mongodb-authentication" className="form-group">
        <FormItemInput
          label="Username"
          name="username"
          error={this.getUsernameError()}
          changeHandler={this.onUsernameChanged.bind(this)}
          value={this.props.currentConnection.mongodb_username || ''} />
        <FormItemInput
          label="Password"
          name="password"
          type="password"
          error={this.getPasswordError()}
          changeHandler={this.onPasswordChanged.bind(this)}
          value={this.props.currentConnection.mongodb_password || ''} />
        <FormItemInput
          label="Authentication Database"
          placeholder="admin"
          name="auth-source"
          changeHandler={this.onAuthSourceChanged.bind(this)}
          value={this.props.currentConnection.mongodb_database_name || ''}
          link="https://docs.mongodb.com/manual/core/security-users/#user-authentication-database" />
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
