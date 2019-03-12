import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './collection-tab.less';

class CollectionTab extends PureComponent {
  static displayName = 'CollectionTabComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired
  };

  /**
   * Render the Collection Tab component.
   *
   * @returns {Component} The rendered component.
   */
  render() {
    const tabClass = classnames({
      [styles['collection-tab']]: true,
      [styles['collection-tab-is-active']]: this.props.isActive
    });

    return (
      <div className={tabClass}>
        <div className={classnames(styles['collection-tab-info'])}>
          <div>{this.props.namespace}</div>
          <div></div>
        </div>
        <div className={classnames(styles['collection-tab-close'])}>
        </div>
      </div>
    );
  }
}

export default CollectionTab;
