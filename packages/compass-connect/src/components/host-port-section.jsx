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
          blurHandler={this.onHostnameChanged.bind(this)} />
        <FormItemInput
          label="Port"
          name="port"
          placeholder="27017"
          blurHandler={this.onPortChanged.bind(this)} />
      </div>
    );
  }
}

HostPortSection.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

HostPortSection.displayName = 'HostPortSection';

module.exports = HostPortSection;
