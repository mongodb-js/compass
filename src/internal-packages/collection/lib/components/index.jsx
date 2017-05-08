const _ = require('lodash');
const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const semver = require('semver');
const { NamespaceStore } = require('hadron-reflux-store');
const { TabNavBar } = require('hadron-react-components');
const toNS = require('mongodb-ns');
const ipc = require('hadron-ipc');

class Collection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {activeTab: 0};

    this.Stats = app.appRegistry.getComponent('CollectionHUD.Item');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.setupTabs();
  }

  componentWillMount() {
    const ns = this.props.namespace;
    if (ns && toNS(ns).collection) {
      this.setState({
        activeTab: this.CollectionStore && this.CollectionStore.getActiveTab()
      });
    } else {
      this.setState({activeTab: 0});
    }
  }

  onTabClicked(idx) {
    // Only proceed if the active tab has changed; prevent multiple clicks
    if (this.state.activeTab === idx) {
      return;
    }

    this.CollectionStore.setActiveTab(idx);
    this.setState({activeTab: this.CollectionStore.getActiveTab()});
  }

  onDBClick() {
    const db = toNS(this.props.namespace).database;
    this.CollectionStore.setCollection({});
    NamespaceStore.ns = db;
    ipc.call('window:hide-collection-submenu');
  }

  setupTabs() {
    const collectionTabs = app.appRegistry.getRole('Collection.Tab');
    const roles = _.filter(collectionTabs, (role) => {
      return this.roleFiltered(role) ? false : true;
    });

    const tabs = _.map(roles, 'name');
    const views = _.map(roles, (role) => {
      return React.createElement(role.component);
    });

    this.tabs = tabs;
    this.views = views;
  }

  roleFiltered(role) {
    const serverVersion = app.instance.build.version;
    return (!app.isFeatureEnabled('chartView') && role.name === 'CHARTS') ||
      (role.minimumServerVersion && !semver.gte(serverVersion, role.minimumServerVersion));
  }

  renderReadonly() {
    if (this.CollectionStore && this.CollectionStore.isReadonly()) {
      return (
        <span className="collection-view-readonly">
          <i className="fa fa-lock" aria-hidden="true" />
        </span>
      );
    }
  }

  render() {
    const database = toNS(this.props.namespace).database;
    const collection = toNS(this.props.namespace).collection;

    return (
      <div className="collection-view clearfix">
        <header>
          <div className="collection-view-header-item">
            <h1 className="collection-view-title">
              <span className="collection-view-database-name"><a className="collection-view-database-name-link" title={database} onClick={this.onDBClick.bind(this)}>{database}</a></span>
              <span>.</span>
              <span className="collection-view-collection-name" title={collection}>{collection}</span>
              {this.renderReadonly()}
            </h1>
          </div>
          <this.Stats />
        </header>

        <TabNavBar
          theme="light"
          tabs={this.tabs}
          views={this.views}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked.bind(this)}
          className="collection-nav"
        />
      </div>
    );
  }
}

Collection.propTypes = {
  namespace: PropTypes.string
};

Collection.displayName = 'Collection';

module.exports = Collection;
