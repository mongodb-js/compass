import React from 'react';
import PropTypes from 'prop-types';

import Actions from '../../../actions';
import FormGroup from '../form-group';
import FormItemSelect from '../form-item-select';
import Kerberos from './kerberos/kerberos';
import LDAP from './ldap/ldap';
import MongoDBAuth from './mongodb-auth/mongodb-auth';
import ScramSha256 from './scram-sha-256/scram-sha-256';

// Note: The ids here are tightly coupled with the
// auth strategies in `mongodb-connection-model`.
const AUTH_STRATEGIES = {
  NONE: {
    id: 'NONE',
    title: 'None'
  },
  MONGODB: {
    id: 'MONGODB',
    title: 'Username / Password'
  },
  'SCRAM-SHA-256': {
    id: 'SCRAM-SHA-256',
    title: 'SCRAM-SHA-256'
  },
  KERBEROS: {
    id: 'KERBEROS',
    title: 'Kerberos'
  },
  LDAP: {
    id: 'LDAP',
    title: 'LDAP'
  },
  X509: {
    id: 'X509',
    title: 'X.509'
  }
};

const selectOptions = Object.values(AUTH_STRATEGIES).map(strategy => ({
  [strategy.id]: strategy.title
}));

class Authentication extends React.Component {
  static displayName = 'Authentication';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    isValid: PropTypes.bool
  };

  constructor(props) {
    super(props);
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
   * Renders an authentication strategy component.
   *
   * @returns {React.Component}
   */
  renderAuthStrategy() {
    switch (this.state.authStrategy) {
      case AUTH_STRATEGIES.KERBEROS.id:
        return (
          <Kerberos
            connectionModel={this.props.connectionModel}
            isValid={this.props.isValid}
          />
        );
      case AUTH_STRATEGIES.LDAP.id:
        return (
          <LDAP
            connectionModel={this.props.connectionModel}
            isValid={this.props.isValid}
          />
        );
      case AUTH_STRATEGIES.NONE.id:
        return;
      case AUTH_STRATEGIES.MONGODB.id:
        return (
          <MongoDBAuth
            connectionModel={this.props.connectionModel}
            isValid={this.props.isValid}
          />
        );
      case AUTH_STRATEGIES['SCRAM-SHA-256'].id:
        return (
          <ScramSha256
            connectionModel={this.props.connectionModel}
            isValid={this.props.isValid}
          />
        );
      case AUTH_STRATEGIES.X509.id:
        return;
      default:
        return;
    }
  }

  render() {
    return (
      <FormGroup id="authStrategy" separator>
        <FormItemSelect
          label="Authentication"
          name="authStrategy"
          options={selectOptions}
          changeHandler={this.onAuthStrategyChanged.bind(this)}
          value={this.props.connectionModel.authStrategy}
        />
        {this.renderAuthStrategy()}
      </FormGroup>
    );
  }
}

export default Authentication;
