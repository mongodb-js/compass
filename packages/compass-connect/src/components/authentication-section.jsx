const find = require('lodash.find');
const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const FormItemSelect = require('./form-item-select');

class AuthenticationSection extends React.Component {

  constructor(props) {
    super(props);
    this.setupAuthenticationRoles();
    this.state = { authenticationMethod: 'NONE' };
  }

  onAuthMethodChanged(evt) {
    this.setState({ authenticationMethod: evt.target.value });
    Actions.onAuthenticationMethodChanged(evt.target.value);
  }

  setupAuthenticationRoles() {
    this.roles = global.hadronApp.appRegistry.getRole('Connect.AuthenticationMethod');
    this.selectOptions = this.roles.map((role) => {
      return role.selectOption;
    });
  }

  renderAuthenticationMethod() {
    const connection = this.props.currentConnection;
    const currentRole = find(this.roles, (role) => {
      return role.name === this.state.authenticationMethod;
    });
    if (currentRole.component) {
      return (<currentRole.component currentConnection={connection} />);
    }
  }

  render() {
    return (
      <div id="authentication" className="form-group">
        <FormItemSelect
          label="Authentication"
          name="authentication"
          options={this.selectOptions}
          changeHandler={this.onAuthMethodChanged.bind(this)} />
        {this.renderAuthenticationMethod()}
      </div>
    );
  }
}

AuthenticationSection.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

AuthenticationSection.displayName = 'AuthenticationSection';

module.exports = AuthenticationSection;
