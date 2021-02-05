import React from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';

import Actions from '../../actions';
import FormGroup from './form-group';
import FormItemSelect from './form-item-select';

class Authentication extends React.Component {
  static displayName = 'Authentication';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    isValid: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.setupAuthenticationRoles();
    this.state = { authStrategy: props.connectionModel.authStrategy };
  }

  componentWillReceiveProps(nextProps) {
    const authStrategy = nextProps.connectionModel.authStrategy;

    if (authStrategy !== this.state.authStrategy) {
      this.setState({ authStrategy });
    }
  }

  /**
   * Changes an authentication strategy.
   *
   * @param {Object} evt - evt.
   */
  onAuthStrategyChanged(evt) {
    this.setState({ authStrategy: evt.target.value });
    Actions.onAuthStrategyChanged(evt.target.value);
  }

  /**
   * Sets options for an authentication strategy.
   */
  setupAuthenticationRoles() {
    this.roles = global.hadronApp.appRegistry.getRole('Connect.AuthStrategy');
    this.selectOptions = this.roles.map(role => role.selectOption);
  }

  /**
   * Renders an authentication strategy component.
   *
   * @returns {React.Component}
   */
  renderAuthStrategy() {
    const currentRole = find(
      this.roles,
      role => role.name === this.state.authStrategy
    );

    if (currentRole.component) {
      return <currentRole.component {...this.props} />;
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
          value={this.props.connectionModel.authStrategy}
        />
        {this.renderAuthStrategy()}
      </FormGroup>
    );
  }
}

export default Authentication;
