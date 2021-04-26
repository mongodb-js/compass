import React from 'react';
import PropTypes from 'prop-types';

/**
 * An input field in a form in a modal.
 */
class ModalInput extends React.PureComponent {

  /**
   * Render the input.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <div className="form-group">
        <p>{this.props.name}</p>
        <input
          autoFocus={this.props.autoFocus}
          id={this.props.id}
          type="text"
          className="form-control"
          onChange={this.props.onChangeHandler}
          value={this.props.value} />
      </div>
    );
  }
}

ModalInput.displayName = 'ModalInputComponent';

ModalInput.propTypes = {
  autoFocus: PropTypes.bool,
  onChangeHandler: PropTypes.func.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired
};

ModalInput.defaultProps = {
  autoFocus: false
};

export default ModalInput;
