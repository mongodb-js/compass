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
          <div className={classnames(styles['collection-tab-info-ns'])}>
            {this.props.namespace}
          </div>
          <div className={classnames(styles['collection-tab-info-subtab'])}>
            Placeholder
          </div>
        </div>
        <div className={classnames(styles['collection-tab-close'])}>
          <i className="fa fa-times" aria-hidden></i>
        </div>
      </div>
    );
  }
}

export default CollectionTab;
