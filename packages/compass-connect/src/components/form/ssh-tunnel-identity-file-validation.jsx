const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const FormFileInput = require('./form-file-input');
const FormItemInput = require('./form-item-input');

const DEFAULT_SSH_TUNNEL_PORT = 22;

class SSHTunnelIdentityFileValidation extends React.Component {

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

  onSSHTunnelIdentityFileChanged(paths) {
    Actions.onSSHTunnelIdentityFileChanged(paths);
  }

  onSSHTunnelPassphraseChanged(evt) {
    Actions.onSSHTunnelPassphraseChanged(evt.target.value);
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
      <div id="ssh_tunnel-IDENTITY_FILE" className="form-group">
        <FormItemInput
          label="SSH Hostname"
          name="ssh_tunnel_hostname"
          changeHandler={this.onSSHTunnelHostnameChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_hostname || ''}
          link="https://docs.mongodb.com/compass/current/connect" />
        <FormItemInput
          label="SSH Tunnel Port"
          name="ssh_tunnel_port"
          placeholder="22"
          changeHandler={this.onSSHTunnelPortChanged.bind(this)}
          value={this.getPort()} />
        <FormItemInput
          label="SSH Username"
          name="ssh_tunnel_username"
          changeHandler={this.onSSHTunnelUsernameChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_username || ''} />
        <FormFileInput
          label="SSH Identity File"
          id="ssh_tunnel_identity_file"
          changeHandler={this.onSSHTunnelIdentityFileChanged.bind(this)}
          values={this.props.currentConnection.ssh_tunnel_identity_file} />
        <FormItemInput
          label="SSH Passphrase"
          name="ssh_tunnel_passphrase"
          changeHandler={this.onSSHTunnelPassphraseChanged.bind(this)}
          value={this.props.currentConnection.ssh_tunnel_passphrase || ''} />
      </div>
    );
  }
}

SSHTunnelIdentityFileValidation.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

SSHTunnelIdentityFileValidation.displayName = 'SSHTunnelIdentityFileValidation';

module.exports = SSHTunnelIdentityFileValidation;
