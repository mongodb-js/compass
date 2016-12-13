const React = require('react');
const app = require('ampersand-app');
const semver = require('semver');
const toNS = require('mongodb-ns');
// const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

class Collection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
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
  }

  componentWillMount() {
    const ns = this.props.namespace;
    if (ns && toNS(ns).collection) {
      this.setState({
        name: ns,
        showView: true,
        activeTab: this.CollectionStore && this.CollectionStore.getActiveTab()
      });
    } else {
      this.setState({name: '', showView: false, activeTab: 0});
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
          <div className="row">
            <div className="col-md-6">
              <h1>{this.state.name}</h1>
            </div>
            <div className="col-md-6">
              <this.Stats />
            </div>
          </div>
        </header>
        <this.TabNavBar
          theme="light"
          tabs={tabs}
          views={views}
          activeTabIndex={this.state.activeTab}
          onTabClicked={this.onTabClicked.bind(this)}
          className="collection-nav"
        />
      </div>
    );
  }

  render() {
    return (this.state.showView ? this.showCollection() : null);
  }
}

Collection.propTypes = {
  showView: React.PropTypes.bool,
  namespace: React.PropTypes.string
};

Collection.displayName = 'Collection';

module.exports = Collection;
