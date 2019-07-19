import React from 'react';
import PropTypes from 'prop-types';
import find from 'lodash.find';
import Actions from 'actions';
import FormGroup from './form-group';
import FormItemSelect from './form-item-select';

class SSLSection extends React.Component {
  static displayName = 'SSLSection';

  static propTypes = { currentConnection: PropTypes.object.isRequired };

  constructor(props) {
    super(props);
    this.setupSSLRoles();
    this.state = { sslMethod: props.currentConnection.sslMethod };
  }

  componentWillReceiveProps(nextProps) {
    const sslMethod = nextProps.currentConnection.sslMethod;

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
    this.roles = global.hadronApp.appRegistry.getRole('Connect.SSLMethod');
    this.selectOptions = this.roles.map((role) => role.selectOption);
  }

  /**
   * Renders an SSL method.
   *
   * @returns {React.Component}
   */
  renderSSLMethod() {
    const currentRole = find(
      this.roles,
      (role) => (role.name === this.state.sslMethod)
    );

    if (currentRole.component) {
      return (<currentRole.component {...this.props} />);
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
          value={this.props.currentConnection.sslMethod} />
        {this.renderSSLMethod()}
      </FormGroup>
    );
  }
}

export default SSLSection;
