import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TabNavBar } from 'hadron-react-components';
import toNS from 'mongodb-ns';
import store from 'stores';
import CollectionHeader from 'components/collection-header';

import styles from './collection.less';

class Collection extends Component {
  static displayName = 'CollectionComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    tabs: PropTypes.array.isRequired,
    views: PropTypes.array.isRequired,
    queryHistoryIndexes: PropTypes.array.isRequired,
    statsPlugin: PropTypes.func.isRequired,
    statsStore: PropTypes.object.isRequired,
    localAppRegistry: PropTypes.object.isRequired,
    activeSubTab: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
    changeActiveSubTab: PropTypes.func.isRequired
  };

  onSubTabClicked = (idx, name) => {
    if (this.props.activeSubTab === idx) {
      return;
    }
    if (!this.props.queryHistoryIndexes.includes(idx)) {
      this.props.localAppRegistry.emit('collapse-query-history');
    }
    this.props.localAppRegistry.emit('subtab-changed', name);
    this.props.changeActiveSubTab(idx, this.props.id);
  }

  /**
   * Render Collection component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.collection, 'clearfix')}>
        <CollectionHeader
          namespace={this.props.namespace}
          isReadonly={this.props.isReadonly}
          statsPlugin={this.props.statsPlugin}
          statsStore={this.props.statsStore} />
        <TabNavBar
          theme="light"
          tabs={this.props.tabs}
          views={this.props.views}
          mountAllViews
          activeTabIndex={this.props.activeSubTab}
          onTabClicked={this.onSubTabClicked} />
      </div>
    );
  }
}

export default Collection;
