import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import FormInput from './form-input';

const DEFAULT_HOST = 'localhost';

class HostInput extends React.PureComponent {
  static displayName = 'HostInput';

  static propTypes = { lastUsed: PropTypes.any, hostname: PropTypes.string };

  constructor(props) {
    super(props);
    this.isChanged = false;
  }

  /**
   * Changes a host name.
   *
   * @param {Object} evt - evt.
   */
  onHostnameChanged(evt) {
    this.isChanged = true;
    Actions.onHostnameChanged(evt.target.value);
  }

  /**
   * Gets a host name.
   *
   * @returns {String} hostname.
   */
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
        placeholder={DEFAULT_HOST}
        changeHandler={this.onHostnameChanged.bind(this)}
        value={this.getHostname()} />
    );
  }
}

export default HostInput;
