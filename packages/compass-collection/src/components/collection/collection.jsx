import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TabNavBar, UnsafeComponent } from 'hadron-react-components';
import AppRegistry from 'hadron-app-registry';
import toNS from 'mongodb-ns';
import filter from 'lodash.filter';
import semver from 'semver';
import store from 'stores';

import styles from './collection.less';

class Collection extends Component {
  static displayName = 'CollectionComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    stores: PropTypes.array.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { activeTab: 0 };

    const app = global.hadronApp;

    this.Stats = app.appRegistry.getComponent('CollectionStats.Component');
    this.QueryActions = app.appRegistry.getAction('Query.Actions');
    this.QueryHistoryActions = app.appRegistry.getAction('QueryHistory.Actions');
<<<<<<< HEAD
    this.setupTabs();
=======
>>>>>>> Moving store creation into reducers
  }

  onTabClicked = (idx) => {
    // Only proceed if the active tab has changed; prevent multiple clicks
    if (this.state.activeTab === idx) {
      return;
    }
    if (!this.queryHistoryIndexes.includes(idx)) {
      this.QueryHistoryActions.collapse();
    }
    this.setState({ activeTab: idx });
  }

  onDBClick = () => {
    const ipc = require('hadron-ipc');
    ipc.call('window:hide-collection-submenu');
  };

  /**
   * Setup the instance level tabs.
   */
  setupTabs() {
    const collectionTabs = global.hadronApp.appRegistry.getRole(
      'Collection.Tab'
    );
    const roles = filter(collectionTabs, (role) => {
      return this.roleFiltered(role) ? false : true;
    });

    const tabs = [];
    const queryHistoryIndexes = [];
    const views = roles.map((role, i) => {
      if (role.hasQueryHistory) queryHistoryIndexes.push(i);
      tabs.push(role.name);
      console.log('collection props', this.props);
      console.log('i', i);
      console.log('store', this.props.stores[i]);
      return (
        <UnsafeComponent component={role.component} key={i} store={this.props.stores[i]} />
      );
    });

    this.tabs = tabs;
    this.views = views;
    this.queryHistoryIndexes = queryHistoryIndexes;
  }

  roleFiltered(role) {
    const serverVersion = global.hadronApp.instance.build.version;
    return (
      role.minimumServerVersion &&
      !semver.gte(serverVersion, role.minimumServerVersion)
    );
  }

  renderReadonly() {
    if (this.CollectionStore && this.CollectionStore.isReadonly()) {
      return (
        <span className={styles['collection-title-readonly']}>
          <i
            className={classnames('fa', styles['collection-title-readonly-view-icon'])}
            aria-hidden="true"
          />
          <span className={styles['collection-title-readonly-view-on']}>
            (on: {this.CollectionStore.viewOn()})
          </span>
        </span>
      );
    }
  }

  /**
   * Render Collection component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const ns = toNS(this.props.namespace);
    const database = ns.database;
    const collection = ns.collection;
    this.setupTabs();

    return (
      <div className={classnames(styles.collection, 'clearfix')}>
        <header>
          <this.Stats />
          <h1 className={styles['collection-title']}>
            <span className={styles['collection-title-db']}>
              <a
                className={styles['collection-title-db-link']}
                title={database}
                onClick={this.onDBClick}>
                {database}
              </a>
            </span>
            <span>.</span>
            <span
              className={styles['collection-title-collection']}
              title={collection}>
              {collection}
            </span>
            {this.renderReadonly()}
          </h1>
        </header>

        <TabNavBar
          theme="light"
          tabs={this.tabs}
          views={this.views}
          mountAllViews
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked}
        />
      </div>
    );
  }
}

export default Collection;
