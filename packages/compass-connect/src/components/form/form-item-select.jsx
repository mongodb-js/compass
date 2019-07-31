import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from '../connect.less';

class FormItemSelect extends React.Component {
  static displayName = 'FormItemSelect';

  static propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    changeHandler: PropTypes.func.isRequired,
    value: PropTypes.string
  };

  /**
   * Prepares options for the form item select.
   *
   * @param {Array} options - A list of otions for select.
   *
   * @returns {React.Component}
   */
  prepareOptions(options) {
    return options.map((option, i) => {
      const select = Object.keys(option)[0];

      return (
        <option key={i} value={select}>
          {option[select]}
        </option>
      );
    });
  }

  render() {
    return (
      <div className={classnames(styles['connect-form-item'])}>
        <label className={classnames(styles['connect-form-item-label'])}>
          {this.props.label}
        </label>
        <select
          name={this.props.name}
          onChange={this.props.changeHandler}
          className={classnames(styles['form-control'])}
          value={this.props.value}
        >
          {this.prepareOptions(this.props.options)}
        </select>
      </div>
    );
  }
}

export default FormItemSelect;
