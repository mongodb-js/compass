import PropTypes from 'prop-types';
import React from 'react';

import Actions from '../../actions';
import FormInput from './form-input';

class PortInput extends React.PureComponent {
  static displayName = 'PortInput';

  static propTypes = {
    port: PropTypes.number // initial port
  };

  constructor(props) {
    super(props);
    this.state = { port: props.port };
  }

  /**
   * Changes port.
   *
   * @param {Object} evt - evt.
   */
  onPortChanged(evt) {
    this.setState({ port: evt.target.value });
    Actions.onPortChanged(evt.target.value ? +evt.target.value : 27017);
  }

  render() {
    if (!this.state) {
      return;
    }

    return (
      <FormInput
        label="Port"
        name="port"
        placeholder="27017"
        changeHandler={this.onPortChanged.bind(this)}
        value={this.state.port}
        type="number"
        otherInputAttributes={{ min: 1, max: 65536 }} />
    );
  }
}

export default PortInput;
