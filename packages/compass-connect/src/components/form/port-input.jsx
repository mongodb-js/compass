const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const { FormInput } = require('hadron-react-components');

const DEFAULT_PORT = 27017;

class PortInput extends React.PureComponent {

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
    if (!this.props.lastUsed && !this.isChanged && this.props.port === DEFAULT_PORT) {
      return '';
    }
    return this.props.port;
  }

  render() {
    return (
      <FormInput
        label="Port"
        name="port"
        placeholder="27017"
        changeHandler={this.onPortChanged.bind(this)}
        value={this.getPort()} />
    );
  }
}

PortInput.propTypes = {
  lastUsed: PropTypes.any,
  port: PropTypes.any
};

PortInput.displayName = 'PortInput';

module.exports = PortInput;
