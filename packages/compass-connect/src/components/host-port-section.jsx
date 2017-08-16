const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const FormItemInput = require('./form-item-input');

class HostPortSection extends React.Component {

  onHostnameChanged(evt) {
    Actions.onHostnameChanged(evt.target.value);
  }

  onPortChanged(evt) {
    Actions.onPortChanged(evt.target.value);
  }

  render() {
    return (
      <div id="host-port" className="form-group">
        <FormItemInput
          label="Hostname"
          name="hostname"
          placeholder="localhost"
          changeHandler={this.onHostnameChanged.bind(this)}
          value={this.props.currentConnection.hostname} />
        <FormItemInput
          label="Port"
          name="port"
          placeholder="27017"
          changeHandler={this.onPortChanged.bind(this)}
          value={this.props.currentConnection.port} />
      </div>
    );
  }
}

HostPortSection.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

HostPortSection.displayName = 'HostPortSection';

module.exports = HostPortSection;
