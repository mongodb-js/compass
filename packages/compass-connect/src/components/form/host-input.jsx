import React from 'react';
import PropTypes from 'prop-types';

import Actions from '../../actions';
import FormInput from './form-input';

class HostInput extends React.PureComponent {
  static displayName = 'HostInput';

  static propTypes = { hostname: PropTypes.string, isHostChanged: PropTypes.bool };

  /**
   * Changes a host name.
   *
   * @param {Object} evt - evt.
   */
  onHostnameChanged(evt) {
    Actions.onHostnameChanged(evt.target.value);
  }

  /**
   * Gets a host name.
   *
   * @returns {String} hostname.
   */
  getHostname() {
    if (this.props.hostname == '') {
      return 'localhost';
    } // little tweak :)
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

export default HostInput;
