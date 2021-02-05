import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash.isempty';

import FormInput from '../../form-input';
import FormGroup from '../../form-group';
import Actions from '../../../../actions';

/**
 * The LDAP auth role component.
 */
class LDAP extends React.Component {
  static displayName = 'LDAP';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    isValid: PropTypes.bool
  };

  static defaultProps = {
    connectionModel: {}
  }

  /**
   * Handle the username change.
   *
   * @param {Event} evt - The event.
   */
  onUsernameChanged(evt) {
    Actions.onLDAPUsernameChanged(evt.target.value.trim());
  }

  /**
   * Handle the password change.
   *
   * @param {Event} evt - The event.
   */
  onPasswordChanged(evt) {
    Actions.onLDAPPasswordChanged(evt.target.value);
  }

  /**
   * Open the help page for LDAP.
   */
  onLDAPHelp() {
    const { shell } = require('electron');
    shell.openExternal('https://docs.mongodb.com/manual/core/security-ldap/');
  }

  /**
   * See if there is an error for the required username field.
   *
   * @returns {boolean} The error message.
   */
  isUsernameError() {
    return (!this.props.isValid && isEmpty(
      this.props.connectionModel.ldapUsername
    ));
  }

  /**
   * See if there is an error for the required password field.
   *
   * @returns {boolean}
   */
  isPasswordError() {
    return (!this.props.isValid && isEmpty(
      this.props.connectionModel.ldapPassword
    ));
  }

  /**
   * Render the ldap component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <FormGroup id="ldap-authentication">
        <FormInput
          label="Username"
          name="ldap-username"
          error={this.isUsernameError()}
          changeHandler={this.onUsernameChanged.bind(this)}
          value={this.props.connectionModel.ldapUsername || ''}
          linkHandler={this.onLDAPHelp.bind(this)}
        />
        <FormInput
          label="Password"
          name="ldap-password"
          type="password"
          error={this.isPasswordError()}
          changeHandler={this.onPasswordChanged.bind(this)}
          value={this.props.connectionModel.ldapPassword || ''}
        />
      </FormGroup>
    );
  }
}

export default LDAP;
