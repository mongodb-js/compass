import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PluginDetail from 'components/plugin-detail';

import styles from './plugin.less';

/**
 * The plugin component.
 */
class Plugin extends Component {
  static displayName = 'PluginComponent';

  /**
   * The properties.
   */
  static propTypes = {
    isActivated: PropTypes.bool.isRequired,
    metadata: PropTypes.object.isRequired,
    error: PropTypes.object
  };

  /**
   * The default properties.
   */
  static defaultProps = {
    isActivated: false
  };

  /**
   * Render Plugin component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.plugin)}>
        <PluginDetail metadata={this.props.metadata} isActivated={this.props.isActivated} />
      </div>
    );
  }
}

export default Plugin;
export { Plugin };
