import React from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';

import Actions from '../../actions';
import FormGroup from './form-group';
import FormItemSelect from './form-item-select';

class SSHTunnel extends React.Component {
  static displayName = 'SSHTunnel';

  static propTypes = { currentConnection: PropTypes.object.isRequired };

  constructor(props) {
    super(props);
    this.setupSSHTunnelRoles();
    this.state = { sshTunnel: props.currentConnection.sshTunnel };
  }

  componentWillReceiveProps(nextProps) {
    const sshMethod = nextProps.currentConnection.sshTunnel;

    if (sshMethod !== this.state.sshTunnel) {
      this.setState({ sshTunnel: sshMethod });
    }
  }

  /**
   * Handles SSH tunnel change.
   *
   * @param {Object} evt - evt.
   */
  onSSHTunnelChanged(evt) {
    this.setState({ sshTunnel: evt.target.value });
    Actions.onSSHTunnelChanged(evt.target.value);
  }

  /**
   * Sets options for an SSH tunnel.
   */
  setupSSHTunnelRoles() {
    this.roles = global.hadronApp.appRegistry.getRole('Connect.SSHTunnel');
    this.selectOptions = this.roles.map(role => role.selectOption);
  }

  /**
   * Renders an SSL tunnel.
   *
   * @returns {React.Component}
   */
  renderSSHTunnel() {
    const currentRole = find(
      this.roles,
      role => role.name === this.state.sshTunnel
    );

    if (currentRole.component) {
      return <currentRole.component {...this.props} />;
    }
  }

  render() {
    return (
      <FormGroup id="ssh-tunnel" separator>
        <FormItemSelect
          label="SSH Tunnel"
          name="sshTunnel"
          options={this.selectOptions}
          changeHandler={this.onSSHTunnelChanged.bind(this)}
          value={this.props.currentConnection.sshTunnel}
        />
        {this.renderSSHTunnel()}
      </FormGroup>
    );
  }
}

export default SSHTunnel;
