const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const FormItemInput = require('./form-item-input');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 27017;

class HostPortSection extends React.Component {

  constructor(props) {
    super(props);
    this.isHostnameChanged = false;
    this.isPortChanged = false;
  }

  onHostnameChanged(evt) {
    this.isHostnameChanged = true;
    Actions.onHostnameChanged(evt.target.value);
  }

  onPortChanged(evt) {
    const value = evt.target.value;
    if (value === '') {
      this.isPortChanged = false;
    } else {
      this.isPortChanged = true;
    }
    Actions.onPortChanged(value);
  }

  getHostname() {
    const connection = this.props.currentConnection;
    if (!connection.last_used && !this.isHostnameChanged && connection.hostname === DEFAULT_HOST) {
      return '';
    }
    return connection.hostname;
  }

  getPort() {
    const connection = this.props.currentConnection;
    if (!connection.last_used && !this.isPortChanged && connection.port === DEFAULT_PORT) {
      return '';
    }
    return connection.port;
  }

  render() {
    return (
      <div id="host-port" className="form-group">
        <FormItemInput
          label="Hostname"
          name="hostname"
          placeholder="localhost"
          changeHandler={this.onHostnameChanged.bind(this)}
          value={this.getHostname()} />
        <FormItemInput
          label="Port"
          name="port"
          placeholder="27017"
          changeHandler={this.onPortChanged.bind(this)}
          value={this.getPort()} />
      </div>
    );
  }
}

HostPortSection.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

HostPortSection.displayName = 'HostPortSection';

module.exports = HostPortSection;
