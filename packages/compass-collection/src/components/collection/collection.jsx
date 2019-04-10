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
    queryHistoryIndexes: PropTypes.array.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { activeTab: 0 };

    const app = global.hadronApp;

    this.QueryActions = app.appRegistry.getAction('Query.Actions');
    this.QueryHistoryActions = app.appRegistry.getAction('QueryHistory.Actions');
  }

  onTabClicked = (idx) => {
    // Only proceed if the active tab has changed; prevent multiple clicks
    if (this.state.activeTab === idx) {
      return;
    }
    if (!this.props.queryHistoryIndexes.includes(idx)) {
      this.QueryHistoryActions.collapse();
    }
    this.setState({ activeTab: idx });
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
          stats={this.props.stats} />
        <TabNavBar
          theme="light"
          tabs={this.props.tabs}
          views={this.props.views}
          mountAllViews
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked}
        />
      </div>
    );
  }
}

export default Collection;
