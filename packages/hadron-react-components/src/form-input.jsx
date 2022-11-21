import React from 'react';
import PropTypes from 'prop-types';

/**
 * Represents an input field within a form.
 */
class FormInput extends React.PureComponent {
  /**
   * Get the error id for the tooltip.
   *
   * @returns {String} The error id.
   */
  getErrorId() {
    return `form-error-tooltip-${this.props.name}`;
  }

  /**
   * Render the input field.
   *
   * @returns {React.Component} The input field.
   */
  render() {
    return (
      <div className="form-item">
        <label>
          <span className="form-item-label">
            {this.props.label}
          </span>
          {this.renderInfoSprinkle()}
        </label>
        <input
          name={this.props.name}
          placeholder={this.props.placeholder}
          onChange={this.props.changeHandler}
          onBlur={this.props.blurHandler}
          value={this.props.value}
          className="form-control"
          type={this.props.type || 'text'}
        />
        {this.renderErrorTooltip()}
      </div>
    );
  }
}

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  changeHandler: PropTypes.func.isRequired,
  blurHandler: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
  type: PropTypes.string
};

FormInput.displayName = 'FormInput';

export default FormInput;
