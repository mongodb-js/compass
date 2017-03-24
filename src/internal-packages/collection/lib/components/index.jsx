const React = require('react');
const app = require('hadron-app');
const semver = require('semver');
const { NamespaceStore } = require('hadron-reflux-store');
const toNS = require('mongodb-ns');
const ipc = require('hadron-ipc');

class CollectionView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {activeTab: 0};

    this.Stats = app.appRegistry.getComponent('CollectionStats.CollectionStats');
    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');
    this.Schema = app.appRegistry.getComponent('Schema.Schema');
    this.Document = app.appRegistry.getComponent('CRUD.DocumentList');
    this.Indexes = app.appRegistry.getComponent('Indexes.Indexes');
    this.Explain = app.appRegistry.getComponent('Explain.ExplainPlan');
    this.Validation = app.appRegistry.getComponent('Validation.Validation');
    this.Charts = app.appRegistry.getComponent('Chart.ChartBuilder');

    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
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

    if (app.isFeatureEnabled('chartView')) {
      tabs.push('CHARTS');
      views.push(<this.Charts />);
    }

    const database = toNS(this.props.namespace).database;
    const collection = toNS(this.props.namespace).collection;

    return (
      <div className="collection-view clearfix">
        <header>
          <div className="row">
            <div className="col-md-6">
              <h1>
                <a onClick={this.onDBClick.bind(this)}>{database}</a>.
                <span>{collection}</span>
                {this.renderReadonly()}
              </h1>
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
}

CollectionView.propTypes = {
  namespace: React.PropTypes.string
};

CollectionView.displayName = 'CollectionView';

module.exports = CollectionView;
