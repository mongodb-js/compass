import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TabNavBar, UnsafeComponent } from 'hadron-react-components';
import toNS from 'mongodb-ns';
import filter from 'lodash.filter';
import semver from 'semver';

import styles from './collection.less';

class Collection extends Component {
  static displayName = 'CollectionComponent';

  static propTypes = {
    namespace: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = { activeTab: 0 };

    const app = global.hadronApp;

    this.Stats = app.appRegistry.getComponent('CollectionStats.Component');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.NamespaceStore = app.appRegistry.getStore('App.NamespaceStore');
    this.QueryActions = app.appRegistry.getAction('Query.Actions');
    this.QueryHistoryActions = app.appRegistry.getAction('QueryHistory.Actions');
    this.boundActiveTabChanged = this.activeTabChanged.bind(this);

    this.setupTabs();
  }

  componentWillMount() {
    const ns = this.props.namespace;
    if (ns && toNS(ns).collection) {
      this.setState({
        activeTab: this.CollectionStore && this.CollectionStore.getActiveTab()
      });
    } else {
      this.setState({ activeTab: 0 });
    }
    if (this.CollectionStore) {
      global.hadronApp.appRegistry.on('active-tab-changed', this.boundActiveTabChanged);
    }
  }

  componentWillUnmount() {
    if (this.CollectionStore) {
      global.hadronApp.appRegistry.removeListener('active-tab-changed', this.boundActiveTabChanged);
    }
  }

  onTabClicked = (idx) => {
    // Only proceed if the active tab has changed; prevent multiple clicks
    if (this.state.activeTab === idx) {
      return;
    }
    if (!this.queryHistoryIndexes.includes(idx)) {
      this.QueryHistoryActions.collapse();
    }

    this.CollectionStore.setActiveTab(idx);
    this.setState({ activeTab: this.CollectionStore.getActiveTab() });
  }

  onDBClick = () => {
    const ipc = require('hadron-ipc');
    const db = toNS(this.props.namespace).database;
    this.CollectionStore.setCollection({});
    this.NamespaceStore.ns = db;
    ipc.call('window:hide-collection-submenu');
  }

  /**
   * Setup the instance level tabs.
   */
  setupTabs() {
    const collectionTabs = global.hadronApp.appRegistry.getRole('Collection.Tab');
    const roles = filter(collectionTabs, (role) => {
      return this.roleFiltered(role) ? false : true;
    });

    const tabs = [];
    const queryHistoryIndexes = [];
    const views = roles.map((role, i) => {
      if (role.hasQueryHistory) queryHistoryIndexes.push(i);
      tabs.push(role.name);
      return (
        <UnsafeComponent component={role.component} key={i} />
      );
    });

    this.tabs = tabs;
    this.views = views;
    this.queryHistoryIndexes = queryHistoryIndexes;
    this.CollectionStore.setTabs(tabs);
  }

  activeTabChanged(index) {
    this.setState({ activeTab: index });
  }


  roleFiltered(role) {
    const serverVersion = global.hadronApp.instance.build.version;
    return (role.minimumServerVersion && !semver.gte(serverVersion, role.minimumServerVersion));
  }

  renderReadonly() {
    if (this.CollectionStore && this.CollectionStore.isReadonly()) {
      return (
        <span className={classnames(styles['collection-title-readonly'])}>
          <i className="fa fa-lock" aria-hidden="true" />
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

    return (
      <div className={classnames(styles.collection, 'clearfix')}>
        <header>
          <this.Stats />
          <h1 className={classnames(styles['collection-title'])}>
            <span className={classnames(styles['collection-title-db'])}>
              <a className={classnames(styles['collection-title-db-link'])} title={database} onClick={this.onDBClick}>{database}</a>
            </span>
            <span>.</span>
            <span className={classnames(styles['collection-title-collection'])} title={collection}>{collection}</span>
            {this.renderReadonly()}
          </h1>
        </header>

        <TabNavBar
          theme="light"
          tabs={this.tabs}
          views={this.views}
          mountAllViews
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked} />
      </div>
    );
  }
}

export default Collection;
