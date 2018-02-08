import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './input.less';

class Input extends Component {
  static displayName = 'InputComponent';

  /**
   * Render the input component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles.input)}>
      </div>
    );
  }
}

export default Input;
