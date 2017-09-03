const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const FormItemInput = require('./form-item-input');

const DEFAULT_SSH_TUNNEL_PORT = 22;

class SSHTunnelPasswordValidation extends React.Component {

  constructor(props) {
    super(props);
    this.isSSHTunnelPortChanged = false;
  }

  onSSHTunnelHostnameChanged(evt) {
    Actions.onSSHTunnelHostnameChanged(evt.target.value);
  }

  onSSHTunnelUsernameChanged(evt) {
    Actions.onSSHTunnelUsernameChanged(evt.target.value);
  }

  onSSHTunnelPasswordChanged(evt) {
    Actions.onSSHTunnelPasswordChanged(evt.target.value);
  }

  onSSHTunnelPortChanged(evt) {
    const value = evt.target.value;
    if (value === '') {
      this.isSSHTunnelPortChanged = false;
    } else {
      this.isSSHTunnelPortChanged = true;
    }
    Actions.onSSHTunnelPortChanged(value);
  }

  getPort() {
    const connection = this.props.currentConnection;
    if (!connection.last_used && !this.isSSHTunnelPortChanged && connection.ssh_tunnel_port === DEFAULT_SSH_TUNNEL_PORT) {
      return '';
    }
    return connection.ssh_tunnel_port;
  }

  render() {
    return (
      <div id="ssh_tunnel-USER_PASSWORD" className="form-group">
        <FormItemInput
          label="SSH Hostname"
          name="ssh_tunnel_hostname"
          changeHandler={this.onSSHTunnelHostnameChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_hostname || ''}
          link="https://docs.mongodb.com/compass/current/connect" />
        <FormItemInput
          label="SSH Tunnel Port"
          name="ssh_tunnel_port"
          changeHandler={this.onSSHTunnelPortChanged.bind(this)}
          value={this.getPort()} />
        <FormItemInput
          label="SSH Username"
          name="ssh_tunnel_username"
          changeHandler={this.onSSHTunnelUsernameChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_username || ''} />
        <FormItemInput
          label="SSH Password"
          name="ssh_tunnel_password"
          changeHandler={this.onSSHTunnelPasswordChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_password || ''} />
      </div>
    );
  }
}

SSHTunnelPasswordValidation.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

SSHTunnelPasswordValidation.displayName = 'SSHTunnelPasswordValidation';

module.exports = SSHTunnelPasswordValidation;
