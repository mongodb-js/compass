import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './plugin-detail.less';

/**
 * The plugin detail component.
 */
class PluginDetail extends Component {
  static displayName = 'PluginDetailComponent';

  /**
   * The properties.
   */
  static propTypes = {
    isActivated: PropTypes.bool.isRequired,
    metadata: PropTypes.object.isRequired
  };

  /**
   * The default properties.
   */
  static defaultProps = {
    isActivated: false
  };

  /**
   * Render the is activated column.
   *
   * @returns {React.Component} The activated column.
   */
  renderIsActivated() {
    if (this.props.isActivated) {
      return (<i className="fa fa-check" />);
    }
  }

  /**
   * Render Plugin Detail component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['plugin-detail'])}>
        <div className={classnames(styles['plugin-detail-product-name'])}>
          {this.props.metadata.productName || this.props.metadata.name}
        </div>
        <div className={classnames(styles['plugin-detail-name'])}>
          {this.props.metadata.name}
        </div>
        <div className={classnames(styles['plugin-detail-version'])}>
          {this.props.metadata.version}
        </div>
        <div className={classnames(styles['plugin-detail-is-activated'])}>
          {this.renderIsActivated()}
        </div>
      </div>
    );
  }
}

export default PluginDetail;
export { PluginDetail };
