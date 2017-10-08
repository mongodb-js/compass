import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Plugin from 'components/plugin';

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
   * Render all the plugin information.
   *
   * @returns {React.Component} The plugins.
   */
  renderPlugins() {
    return this.props.plugins.map((plugin, i) => {
      return (
        <Plugin key={i} isActivated={plugin.isActivated} metadata={plugin.metadata} />
      );
    });
  }

  /**
   * Render Security component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const classes = {};
    classes[styles.security] = true;
    classes[styles['security-is-visible']] = this.props.isVisible;
    return (
      <div className={classnames(classes)}>
        {this.renderPlugins()}
      </div>
    );
  }
}

export default Security;
export { Security };
