import React from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';

import Actions from '../../actions';
import FormGroup from './form-group';
import FormItemSelect from './form-item-select';

import SSLServerValidation from './ssl-server-validation';
import SSLServerClientValidation from './ssl-server-client-validation';

const ROLES = [
  {
    name: 'DEFAULT',
    selectOption: { DEFAULT: 'Default' }
  },
  {
    name: 'NONE',
    selectOption: { NONE: 'Never use SSL/TLS' }
  },
  {
    name: 'SYSTEMCA',
    selectOption: { SYSTEMCA: 'System CA / Atlas Deployment' }
  },
  {
    name: 'UNVALIDATED',
    selectOption: { UNVALIDATED: 'Unvalidated (insecure)' }
  },
  {
    name: 'SERVER',
    selectOption: { SERVER: 'Server Validation' },
    component: SSLServerValidation
  },
  {
    name: 'ALL',
    selectOption: { ALL: 'Server and Client Validation' },
    component: SSLServerClientValidation
  }
];

class SSLMethod extends React.Component {
  static displayName = 'SSLMethod';

  static propTypes = { connectionModel: PropTypes.object.isRequired };

  constructor(props) {
    super(props);
    this.setupSSLRoles();
    this.state = { sslMethod: props.connectionModel.sslMethod };
  }

  componentWillReceiveProps(nextProps) {
    const sslMethod = nextProps.connectionModel.sslMethod;

    if (sslMethod !== this.state.sslMethod) {
      this.setState({ sslMethod: sslMethod });
    }
  }

  /**
   * Handles SSL method change.
   *
   * @param {Object} evt - evt.
   */
  onSSLMethodChanged(evt) {
    this.setState({ sslMethod: evt.target.value });
    Actions.onSSLMethodChanged(evt.target.value);
  }

  /**
   * Sets options for an SSL method.
   */
  setupSSLRoles() {
    this.roles = ROLES;
    this.selectOptions = this.roles.map(role => role.selectOption);
  }

  /**
   * Renders an SSL method.
   *
   * @returns {React.Component}
   */
  renderSSLMethod() {
    const currentRole = find(
      this.roles,
      role => role.name === this.state.sslMethod
    );

    if (!currentRole) {
      return (<div/>);
    }

    if (currentRole.component) {
      return <currentRole.component {...this.props} />;
    }
  }

  render() {
    return (
      <FormGroup id="sslMethod" separator>
        <FormItemSelect
          label="SSL"
          name="sslMethod"
          options={this.selectOptions}
          changeHandler={this.onSSLMethodChanged.bind(this)}
          value={this.props.connectionModel.sslMethod}
        />
        {this.renderSSLMethod()}
      </FormGroup>
    );
  }
}

export default SSLMethod;
