import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './plugin-error.less';

/**
 * The plugin error component.
 */
class PluginError extends Component {
  static displayName = 'PluginErrorComponent';

  /**
   * The properties.
   */
  static propTypes = {
    error: PropTypes.object.isRequired
  };

  /**
   * Render Plugin Error component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['plugin-error'])}>
        <div className={classnames(styles['plugin-error-message'])}>
          {this.props.error.message}
        </div>
        <div className={classnames(styles['plugin-error-stack'])}>
          {this.props.error.stack}
        </div>
      </div>
    );
  }
}

export default PluginError;
export { PluginError };
