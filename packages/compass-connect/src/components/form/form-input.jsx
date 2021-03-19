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
        <i
          className={styles.help}
          onClick={this.props.linkHandler}
        />
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
      <div className={classnames({
        [styles['form-item']]: true,
        [styles['form-item-has-error']]: this.props.error
      })}>
        <label>
          <span className={styles['form-item-label']}>
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
          className={styles['form-control']}
          type={this.props.type || 'text'}
          {...this.props.otherInputAttributes}
        />
      </div>
    );
  }
}

export default FormInput;
