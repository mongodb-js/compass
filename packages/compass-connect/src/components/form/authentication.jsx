const find = require('lodash.find');
const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const FormGroup = require('./form-group');
const FormItemSelect = require('./form-item-select');

class AuthenticationSection extends React.Component {

  constructor(props) {
    super(props);
    this.setupAuthenticationRoles();
    this.state = { authenticationMethod: props.currentConnection.authentication };
  }

  componentWillReceiveProps(nextProps) {
    const authMethod = nextProps.currentConnection.authentication;
    if (authMethod !== this.state.authenticationMethod) {
      this.setState({ authenticationMethod: authMethod });
    }
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
    const currentRole = find(this.roles, (role) => {
      return role.name === this.state.authenticationMethod;
    });
    if (currentRole.component) {
      return (<currentRole.component {...this.props} />);
    }
  }

  render() {
    return (
      <FormGroup id="authentication" separator>
        <FormItemSelect
          label="Authentication"
          name="authentication"
          options={this.selectOptions}
          changeHandler={this.onAuthMethodChanged.bind(this)}
          value={this.props.currentConnection.authentication} />
        {this.renderAuthenticationMethod()}
      </FormGroup>
    );
  }
}

AuthenticationSection.propTypes = {
  currentConnection: PropTypes.object.isRequired,
  isValid: PropTypes.bool
};

AuthenticationSection.displayName = 'AuthenticationSection';

module.exports = AuthenticationSection;
