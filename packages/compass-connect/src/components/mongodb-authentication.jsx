const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
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

  render() {
    return (
      <div id="mongodb-authentication" className="form-group">
        <FormItemInput
          label="Username"
          name="username"
          blurHandler={this.onUsernameChanged.bind(this)} />
        <FormItemInput
          label="Password"
          name="password"
          blurHandler={this.onPasswordChanged.bind(this)} />
        <FormItemInput
          label="Authentication Database"
          name="auth-source"
          blurHandler={this.onAuthSourceChanged.bind(this)} />
      </div>
    );
  }
}

MongoDBAuthentication.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

MongoDBAuthentication.displayName = 'MongoDBAuthentication';

module.exports = MongoDBAuthentication;
