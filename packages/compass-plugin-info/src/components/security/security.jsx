import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './security.less';

/**
 * The security panel component.
 */
class Security extends Component {
  static displayName = 'SecurityComponent';

  /**
   * The properties.
   */
  static propTypes = {
    isVisible: PropTypes.bool,
    plugins: PropTypes.array
  };

  /**
   * The default properties.
   */
  static defaultProps = {
    isVisible: false,
    plugins: []
  };

  /**
   * Render Security component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.security)}>
      </div>
    );
  }
}

export default Security;
export { Security };
