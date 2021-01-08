import PropTypes from 'prop-types';
import React from 'react';

import Actions from '../../actions';
import FormInput from './form-input';

class PortInput extends React.PureComponent {
  static displayName = 'PortInput';

  static propTypes = { port: PropTypes.number, isPortChanged: PropTypes.bool };

  /**
   * Changes port.
   *
   * @param {Object} evt - evt.
   */
  onPortChanged(evt) {
    Actions.onPortChanged(+evt.target.value);
  }

  /**
   * Gets port.
   *
   * @returns {Number} port.
   */
  getPort() {
    if (this.props.isPortChanged === false) {
      return 27017;
    }

    return +this.props.port;
  }

  render() {
    return (
      <FormInput
        label="Port"
        name="port"
        placeholder="27017"
        changeHandler={this.onPortChanged.bind(this)}
        value={this.getPort()}
        type="number"
        otherInputAttributes={{min: 1, max: 65536}} />
    );
  }
}

export default PortInput;
