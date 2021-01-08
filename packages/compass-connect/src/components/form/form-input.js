import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from '../connect.less';

/**
 * Represents an input field within a form.
 */
class FormInput extends React.PureComponent {
  static displayName = 'FormInput';

  static propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    changeHandler: PropTypes.func.isRequired,
    blurHandler: PropTypes.func,
    linkHandler: PropTypes.func,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
    type: PropTypes.string,
    error: PropTypes.bool,
    otherInputAttributes: PropTypes.object
  };

  /**
   * Gets the class name for the input wrapper.
   *
   * @returns {String} The class name.
   */
  getClassName() {
    const className = {
      [styles['form-item']]: true,
      [styles['form-item-has-error']]: this.props.error
    };

    return classnames(className);
  }

  /**
   * Gets the error id for the tooltip.
   *
   * @returns {String} The error id.
   */
  getErrorId() {
    return `form-error-tooltip-${this.props.name}`;
  }

  /**
   * Renders the info sprinkle if a link handler was provided.
   *
   * @returns {React.Component} The info sprinkle.
   */
  renderInfoSprinkle() {
    if (this.props.linkHandler) {
      return (
        <i className={classnames(styles.help)} onClick={this.props.linkHandler} />
      );
    }
  }

  /**
   * Renders the input field.
   *
   * @returns {React.Component} The input field.
   */
  render() {
    return (
      <div className={this.getClassName()}>
        <label>
          <span className={classnames(styles['form-item-label'])}>
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
          className={classnames(styles['form-control'])}
          type={this.props.type || 'text'}
          {...this.otherInputAttributes} />
      </div>
    );
  }
}

export default FormInput;
