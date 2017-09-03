const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const FormItemInput = require('./form-item-input');

const DEFAULT_PORT = 27017;

class PortInput extends React.Component {

  constructor(props) {
    super(props);
    this.isChanged = false;
  }

  onPortChanged(evt) {
    const value = evt.target.value;
    if (value === '') {
      this.isChanged = false;
    } else {
      this.isChanged = true;
    }
    Actions.onPortChanged(value);
  }

  getPort() {
    const connection = this.props.currentConnection;
    if (!connection.last_used && !this.isChanged && connection.port === DEFAULT_PORT) {
      return '';
    }
    return connection.port;
  }

  render() {
    return (
      <FormItemInput
        label="Port"
        name="port"
        placeholder="27017"
        changeHandler={this.onPortChanged.bind(this)}
        value={this.getPort()} />
    );
  }
}

PortInput.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

PortInput.displayName = 'PortInput';

module.exports = PortInput;
