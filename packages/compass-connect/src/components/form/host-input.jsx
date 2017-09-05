const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const { FormInput } = require('hadron-react-components');

const DEFAULT_HOST = 'localhost';

class HostInput extends React.Component {

  constructor(props) {
    super(props);
    this.isChanged = false;
  }

  onHostnameChanged(evt) {
    this.isChanged = true;
    Actions.onHostnameChanged(evt.target.value);
  }

  getHostname() {
    const connection = this.props.currentConnection;
    if (!connection.last_used && !this.isChanged && connection.hostname === DEFAULT_HOST) {
      return '';
    }
    return connection.hostname;
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
  currentConnection: PropTypes.object.isRequired
};

HostInput.displayName = 'HostInput';

module.exports = HostInput;
