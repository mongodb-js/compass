const React = require('react');
const app = require('ampersand-app');
const semver = require('semver');
const toNS = require('mongodb-ns');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

class Collection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      db: '',
      col: '',
      showView: this.props.showView || false,
      activeTab: 0
    };
    this.Stats = app.appRegistry.getComponent('CollectionStats.CollectionStats');

    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');

    this.Schema = app.appRegistry.getComponent('Schema.Schema');
    this.Document = app.appRegistry.getComponent('CRUD.DocumentList');
    this.Indexes = app.appRegistry.getComponent('Indexes.Indexes');
    this.Explain = app.appRegistry.getComponent('Explain.ExplainPlan');
    this.Validation = app.appRegistry.getComponent('Validation.Validation');

    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');

    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this.setState({name: ns, db: toNS(ns).database, col: toNS(ns).collection, showView: true, activeTab: this.CollectionStore.getActiveTab()});
      } else {
        this.setState({name: '', showView: false, activeTab: 0});
      }
    });
  }

  onTabClicked(idx) {
    // Only proceed if the active tab has changed; prevent multiple clicks
    if (this.state.activeTab === idx) {
      return;
    }

    this.CollectionStore.setActiveTab(idx);
    this.setState({activeTab: this.CollectionStore.getActiveTab()});
  }

  showCollection() {
    const serverVersion = app.instance.build.version;
    const DV_ENABLED = semver.gt(serverVersion, '3.2.0-rc0');
    const tabs = [
      'SCHEMA',
      'DOCUMENTS',
      'INDEXES',
      'EXPLAIN PLAN'
    ];
    const views = [
      <this.Schema />,
      <this.Document />,
      <this.Indexes />,
      <this.Explain />
    ];
    if (DV_ENABLED) {
      tabs.push('VALIDATION');
      views.push(<this.Validation />);
    }

    return (
      <div className="collection-view clearfix">
        <header>
          <h1>
            <span className="breadcrumb">
              DATABASE <span>{this.state.db}</span>
            </span>
            <span className="breadcrumb">
              COLLECTION <span>{this.state.col}</span>
            </span>
          </h1>
          <this.Stats />
        </header>
        <this.TabNavBar
          theme="light"
          tabs={tabs}
          views={views}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked.bind(this)}
          className="rt-nav" // TODO @KeyboardTsundoku this could be something else?
        />
      </div>
    );
  }

  render() {
    return (this.state.showView ? this.showCollection() : null);
  }
}

Collection.propTypes = {
  showView: React.PropTypes.bool
};

Collection.displayName = 'Collection';

module.exports = Collection;
