const find = require('lodash.find');
const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const FormItemSelect = require('./form-item-select');
const FormGroup = require('./form-group');

class SSHTunnelSection extends React.Component {
  constructor(props) {
    super(props);
    this.setupSSHTunnelRoles();
    this.state = { sshTunnelMethod: props.currentConnection.sshTunnel };
  }

  componentWillReceiveProps(nextProps) {
    const sshMethod = nextProps.currentConnection.sshTunnel;

    if (sshMethod !== this.state.sshTunnelMethod) {
      this.setState({ sshTunnelMethod: sshMethod });
    }
  }

  onSSHTunnelChanged(evt) {
    this.setState({ sshTunnelMethod: evt.target.value });
    Actions.onSSHTunnelChanged(evt.target.value);
  }

  setupSSHTunnelRoles() {
    this.roles = global.hadronApp.appRegistry.getRole('Connect.SSHTunnelMethod');
    this.selectOptions = this.roles.map((role) => role.selectOption);
  }

  renderSSHTunnelMethod() {
    const currentRole = find(
      this.roles,
      (role) => (role.name === this.state.sshTunnelMethod)
    );

    if (currentRole.component) {
      return (<currentRole.component {...this.props} />);
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
          value={this.props.currentConnection.sshTunnel} />
        {this.renderSSHTunnelMethod()}
      </FormGroup>
    );
  }
}

SSHTunnelSection.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

SSHTunnelSection.displayName = 'SSHTunnelSection';

module.exports = SSHTunnelSection;
