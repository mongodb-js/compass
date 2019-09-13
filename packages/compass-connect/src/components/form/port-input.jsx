import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import FormInput from './form-input';

class PortInput extends React.PureComponent {
  static displayName = 'PortInput';

  static propTypes = { port: PropTypes.any, isPortChanged: PropTypes.bool };

  /**
   * Changes port.
   *
   * @param {Object} evt - evt.
   */
  onPortChanged(evt) {
    Actions.onPortChanged(evt.target.value);
  }

  /**
   * Gets port.
   *
   * @returns {Number} port.
   */
  getPort() {
    if (this.props.isPortChanged === false) {
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

export default PortInput;
