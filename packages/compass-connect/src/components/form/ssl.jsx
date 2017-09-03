const find = require('lodash.find');
const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const FormItemSelect = require('./form-item-select');
const FormGroup = require('./form-group');

class SSLSection extends React.Component {

  constructor(props) {
    super(props);
    this.setupSSLRoles();
    this.state = { sslMethod: props.currentConnection.ssl };
  }

  componentWillReceiveProps(nextProps) {
    const sslMethod = nextProps.currentConnection.ssl;
    if (sslMethod !== this.state.sslMethod) {
      this.setState({ sslMethod: sslMethod });
    }
  }

  onSSLMethodChanged(evt) {
    this.setState({ sslMethod: evt.target.value });
    Actions.onSSLMethodChanged(evt.target.value);
  }

  setupSSLRoles() {
    this.roles = global.hadronApp.appRegistry.getRole('Connect.SSLMethod');
    this.selectOptions = this.roles.map((role) => {
      return role.selectOption;
    });
  }

  renderSSLMethod() {
    const currentRole = find(this.roles, (role) => {
      return role.name === this.state.sslMethod;
    });
    if (currentRole.component) {
      return (<currentRole.component {...this.props} />);
    }
  }

  render() {
    return (
      <FormGroup id="ssl" separator>
        <FormItemSelect
          label="SSL"
          name="ssl"
          options={this.selectOptions}
          changeHandler={this.onSSLMethodChanged.bind(this)}
          value={this.props.currentConnection.ssl} />
        {this.renderSSLMethod()}
      </FormGroup>
    );
  }
}

SSLSection.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

SSLSection.displayName = 'SSLSection';

module.exports = SSLSection;
