import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PluginDetail from 'components/plugin-detail';
import PluginError from 'components/plugin-error';

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
   * We keep expanded state in this component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { isExpanded: false };
  }

  /**
   * When the user clicks the expand button.
   */
  onExpandClick() {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  /**
   * Get the root class names of the component.
   *
   * @returns {Object} The classnames object.
   */
  rootClassNames() {
    const classes = {};
    classes[styles.plugin] = true;
    classes[styles['plugin-has-error']] = this.props.error;
    return classes;
  }

  /**
   * Render the plugin error if expanded.
   *
   * @returns {React.Component} The plugin error component.
   */
  renderPluginError() {
    if (this.state.isExpanded) {
      return (
        <PluginError error={this.props.error} />
      );
    }
  }

  /**
   * Render Plugin component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(this.rootClassNames())}>
        <PluginDetail {...this.props}
          isExpanded={this.state.isExpanded}
          expandHandler={this.onExpandClick.bind(this)} />
        {this.renderPluginError()}
      </div>
    );
  }
}

export default Plugin;
export { Plugin };
