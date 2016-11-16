const React = require('react');
const app = require('ampersand-app');
const toNS = require('mongodb-ns');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

class Collection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      showView: false,
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
        this.setState({name: toNS(ns).collection, showView: true, activeTab: this.CollectionStore.getActiveTab()});
      } else {
        this.setState({name: '', showView: false, activeTab: 0});
      }
    });
  }

  onTabClicked(idx) {
    this.setState({activeTab: idx});
    this.CollectionStore.setActiveTab(idx);
  }

  showCollection() {
    const tabs = [
      'SCHEMA',
      'DOCUMENTS',
      'EXPLAIN PLAN',
      'INDEXES',
      'VALIDATION'
    ];
    const views = [
      <this.Schema />,
      <this.Document />,
      <this.Explain />,
      <this.Indexes />,
      <this.Validation />
    ];

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
          className="rt-nav" // TODO @KeyboardTsundoku this could be something else?
        />
      </div>
    );
  }

  render() {
    return (this.state.showView ? this.showCollection() : null);
  }
}

Collection.displayName = 'Collection';

module.exports = Collection;
