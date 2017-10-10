import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Plugin from 'components/plugin';
import Actions from 'actions';

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

  hide() {
    Actions.hide();
  }

  /**
   * Get the root class names of the component.
   *
   * @returns {Object} The classnames object.
   */
  rootClassNames() {
    const classes = {};
    classes[styles.security] = true;
    classes[styles['security-is-visible']] = this.props.isVisible;
    return classes;
  }

  /**
   * Render all the plugin information.
   *
   * @returns {React.Component} The plugins.
   */
  renderPlugins() {
    return this.props.plugins.map((plugin, i) => {
      return (
        <Plugin
          key={i}
          isActivated={plugin.isActivated}
          metadata={plugin.metadata}
          error={plugin.error} />
      );
    });
  }

  /**
   * Render Security component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(this.rootClassNames())}>
        <div className={classnames(styles['security-header'])}>
          <span>Installed Plugins</span>
          <button className="btn btn-default btn-xs" onClick={this.hide.bind(this)}>
            Close
          </button>
        </div>
        <div className={classnames(styles['security-content'])}>
          {this.renderPlugins()}
        </div>
      </div>
    );
  }
}

export default Security;
export { Security };
