import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './collection-tab.less';

class CollectionTab extends PureComponent {
  static displayName = 'CollectionTabComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    closeTab: PropTypes.func.isRequired,
    selectTab: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired
  };

  /**
   * Close the tab.
   */
  closeTab = () => {
    this.props.closeTab(this.props.index);
  }

  /**
   * Select the tab.
   */
  selectTab = () => {
    this.props.selectTab(this.props.index);
  }

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
        <div className={classnames(styles['collection-tab-info'])} onClick={this.selectTab}>
          <div className={classnames(styles['collection-tab-info-ns'])}>
            {this.props.namespace}
          </div>
          <div className={classnames(styles['collection-tab-info-subtab'])}>
            Placeholder
          </div>
        </div>
        <div className={classnames(styles['collection-tab-close'])} onClick={this.closeTab}>
          <i className="fa fa-times" aria-hidden></i>
        </div>
      </div>
    );
  }
}

export default CollectionTab;
