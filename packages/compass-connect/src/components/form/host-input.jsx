const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const { FormInput } = require('hadron-react-components');

const DEFAULT_HOST = 'localhost';

class HostInput extends React.PureComponent {

  constructor(props) {
    super(props);
    this.isChanged = false;
  }

  onHostnameChanged(evt) {
    this.isChanged = true;
    Actions.onHostnameChanged(evt.target.value);
  }

  getHostname() {
    if (!this.props.lastUsed && !this.isChanged && this.props.hostname === DEFAULT_HOST) {
      return '';
    }
    return this.props.hostname;
  }

  render() {
    return (
      <FormInput
        label="Hostname"
        name="hostname"
        placeholder="localhost"
        changeHandler={this.onHostnameChanged.bind(this)}
        value={this.getHostname()} />
    );
  }
}

HostInput.propTypes = {
  lastUsed: PropTypes.any,
  hostname: PropTypes.string
};

HostInput.displayName = 'HostInput';

module.exports = HostInput;
