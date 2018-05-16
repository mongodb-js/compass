const _ = require('lodash');
const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const semver = require('semver');
const { TabNavBar, UnsafeComponent } = require('hadron-react-components');
const toNS = require('mongodb-ns');
const ipc = require('hadron-ipc');

class Collection extends React.Component {
  constructor(props) {
    super(props);

    this.state = { activeTab: 0 };

    this.Stats = app.appRegistry.getComponent('CollectionStats.Component');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.NamespaceStore = app.appRegistry.getStore('App.NamespaceStore');
    this.QueryActions = app.appRegistry.getAction('Query.Actions');
    this.QueryHistoryActions = app.appRegistry.getAction('QueryHistory.Actions');
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
      this.CollectionStore.listen((index) => {
        this.setState({ activeTab: index });
      });
    }
  }

  componentDidUpdate() {
    this.QueryActions.refreshCodeMirror();
  }

  onTabClicked(idx) {
    // Only proceed if the active tab has changed; prevent multiple clicks
    if (this.state.activeTab === idx) {
      return;
    }
    if (!this.queryHistoryIndexes.includes(idx)) {
      this.QueryHistoryActions.collapse();
    }

    this.CollectionStore.setActiveTab(idx);
    this.setState({activeTab: this.CollectionStore.getActiveTab()});
  }

  onDBClick() {
    const db = toNS(this.props.namespace).database;
    this.CollectionStore.setCollection({});
    this.NamespaceStore.ns = db;
    ipc.call('window:hide-collection-submenu');
  }

  setupTabs() {
    const collectionTabs = app.appRegistry.getRole('Collection.Tab');
    const roles = _.filter(collectionTabs, (role) => {
      return this.roleFiltered(role) ? false : true;
    });

    const tabs = _.map(roles, 'name');
    const views = _.map(roles, (role, i) => {
      return (
        <UnsafeComponent component={role.component} key={i} />
      );
    });
    const queryHistoryIndexes = _.map(roles, (role, index) => {
      if (role.hasQueryHistory) return index;
    });

    this.tabs = tabs;
    this.views = views;
    this.queryHistoryIndexes = queryHistoryIndexes;
  }

  roleFiltered(role) {
    const serverVersion = app.instance.build.version;
    return (role.minimumServerVersion && !semver.gte(serverVersion, role.minimumServerVersion));
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
          <this.Stats />
          <h1 className="collection-view-title">
            <span className="collection-view-database-name"><a className="collection-view-database-name-link" title={database} onClick={this.onDBClick.bind(this)}>{database}</a></span>
            <span>.</span>
            <span className="collection-view-collection-name" title={collection}>{collection}</span>
            {this.renderReadonly()}
          </h1>
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
