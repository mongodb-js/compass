import React from 'react';
import ReactTooltip from 'react-tooltip';
import PropTypes from 'prop-types';

/**
 * Represents an input field within a form.
 */
class FormInput extends React.PureComponent {

  /**
   * Get the class name for the input wrapper.
   *
   * @returns {String} The class name.
   */
  getClassName() {
    const className = 'form-item';
    if (this.props.error) {
      return `${className} form-item-has-error`;
    }
    return className;
  }

  /**
   * Get the error id for the tooltip.
   *
   * @returns {String} The error id.
   */
  getErrorId() {
    return `form-error-tooltip-${this.props.name}`;
  }

  /**
   * Render the info sprinkle if a link handler was provided.
   *
   * @returns {React.Component} The info sprinkle.
   */
  renderInfoSprinkle() {
    if (this.props.linkHandler) {
      return (
        <i className="help" onClick={this.props.linkHandler} />
      );
    }
  }

  /**
   * Render the error icon.
   *
   * @returns {React.Component} The error icon.
   */
  renderError() {
    if (this.props.error) {
      return (
        <i className="fa fa-exclamation-circle" aria-hidden="true" />
      );
    }
  }

  /**
   * Render the error tooltip.
   *
   * @returns {React.Component} The error tooltip.
   */
  renderErrorTooltip() {
    if (this.props.error) {
      return (
        <ReactTooltip id={this.getErrorId()} />
      );
    }
  }

  /**
   * Render the input field.
   *
   * @returns {React.Component} The input field.
   */
  render() {
    const tooltipOptions = this.props.error ? {
      'data-for': this.getErrorId(),
      'data-effect': 'solid',
      'data-place': 'bottom',
      'data-offset': "{'bottom': -2}",
      'data-tip': this.props.error,
      'data-type': 'error'
    } : {};
    return (
      <div className={this.getClassName()}>
        <label>
          <span className="form-item-label">
            {this.renderError()}
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
          {...tooltipOptions} />
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
  linkHandler: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
  type: PropTypes.string,
  error: PropTypes.string
};

FormInput.displayName = 'FormInput';

export default FormInput;
