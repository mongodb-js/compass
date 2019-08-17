import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import FormInput from './form-input';

const DEFAULT_PORT = 27017;

class PortInput extends React.PureComponent {
  static displayName = 'PortInput';

  static propTypes = { lastUsed: PropTypes.any, port: PropTypes.any };

  constructor(props) {
    super(props);
    this.isChanged = false;
  }

  /**
   * Changes port.
   *
   * @param {Object} evt - evt.
   */
  onPortChanged(evt) {
    const value = evt.target.value;

    if (value === '') {
      this.isChanged = false;
    } else {
      this.isChanged = true;
    }

    Actions.onPortChanged(value);
  }

  /**
   * Gets port.
   *
   * @returns {Number} port.
   */
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

export default PortInput;
