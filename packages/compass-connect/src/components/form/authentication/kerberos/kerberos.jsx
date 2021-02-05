import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash.isempty';

import FormInput from '../../form-input';
import FormGroup from '../../form-group';
import Actions from '../../../../actions';
import CnameInput from './cname-input';

/**
 * The kerberos auth role component.
 */
class Kerberos extends React.Component {
  static displayName = 'Kerberos';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    isValid: PropTypes.bool
  }

  static defaultProps = {
    connectionModel: {}
  }

  /**
   * Handle the principal change.
   *
   * @param {Event} evt - The event.
   */
  onPrincipalChanged(evt) {
    Actions.onKerberosPrincipalChanged(evt.target.value.trim());
  }

  /**
   * Handle the service name change.
   *
   * @param {Event} evt - The event.
   */
  onServiceNameChanged(evt) {
    Actions.onKerberosServiceNameChanged(evt.target.value);
  }

  /**
   * Open the help page for the principal.
   */
  onPrincipalHelp() {
    const { shell } = require('electron');
    shell.openExternal('https://docs.mongodb.com/manual/core/kerberos/#principals');
  }

  /**
   * Get if there is an error for the required principal field.
   *
   * @returns {Boolean} If there's an error.
   */
  isPrincipalError() {
    return !this.props.isValid && isEmpty(
      this.props.connectionModel.kerberosPrincipal
    );
  }

  /**
   * Render the kerberos component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <FormGroup id="kerberos-authentication">
        <FormInput
          label="Principal"
          name="kerberos-principal"
          error={this.isPrincipalError()}
          changeHandler={this.onPrincipalChanged.bind(this)}
          value={this.props.connectionModel.kerberosPrincipal || ''}
          linkHandler={this.onPrincipalHelp.bind(this)}
        />
        <FormInput
          label="Service Name"
          placeholder="mongodb"
          name="kerberos-service-name"
          changeHandler={this.onServiceNameChanged.bind(this)}
          value={this.props.connectionModel.kerberosServiceName || ''}
        />
        <CnameInput
          canonicalize_hostname={this.props.connectionModel.kerberosCanonicalizeHostname || false}
        />
      </FormGroup>
    );
  }
}

export default Kerberos;
