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
    this.state = { authStrategy: props.currentConnection.authStrategy };
  }

  componentWillReceiveProps(nextProps) {
    const authStrategy = nextProps.currentConnection.authStrategy;

    if (authStrategy !== this.state.authStrategy) {
      this.setState({ authStrategy });
    }
  }

  onAuthStrategyChanged(evt) {
    this.setState({ authStrategy: evt.target.value });
    Actions.onAuthenticationMethodChanged(evt.target.value);
  }

  setupAuthenticationRoles() {
    this.roles = global.hadronApp.appRegistry.getRole('Connect.AuthStrategy');
    this.selectOptions = this.roles.map((role) => role.selectOption);
  }

  renderAuthStrategy() {
    const currentRole = find(
      this.roles,
      (role) => (role.name === this.state.authStrategy)
    );

    if (currentRole.component) {
      return (<currentRole.component {...this.props} />);
    }
  }

  render() {
    return (
      <FormGroup id="authStrategy" separator>
        <FormItemSelect
          label="Authentication"
          name="authStrategy"
          options={this.selectOptions}
          changeHandler={this.onAuthStrategyChanged.bind(this)}
          value={this.props.currentConnection.authStrategy} />
        {this.renderAuthStrategy()}
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
