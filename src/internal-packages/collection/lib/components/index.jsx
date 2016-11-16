const React = require('react');
const app = require('ampersand-app');
const toNS = require('mongodb-ns');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
// const debug = require('debug')('component:collection');

class ConnectedCollection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ns: '',
      showView: false
    };
    this.Stats = app.appRegistry.getComponent('CollectionStats.CollectionStats');

    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');

    this.Schema = app.appRegistry.getComponent('Schema.Schema');
    this.Document = app.appRegistry.getComponent('CRUD.DocumentList');
    this.Indexes = app.appRegistry.getComponent('Indexes.Indexes');
    this.Explain = app.appRegistry.getComponent('Explain.ExplainPlan');
    this.Validation = app.appRegistry.getComponent('Validation.Validation');

    this.store = app.appRegistry.getStore('App.CollectionStore');
    this.name = this.store.ns();
    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this.setState({ns: ns, showView: true});
      } else {
        this.setState({ns: '', showView: false});
      }
    });
    // this.state = {ns: this.store.ns()};
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
      <div>
        <header>
          <div className="row">
            <div className="col-md-6">
              <h1>{this.name}</h1>
            </div>
            <div className="col-md-6">
              <this.Stats />
            </div>
          </div>
        </header>
        <div>
        <this.TabNavBar
          theme="light"
          tabs={tabs}
          views={views}
          activeTabIndex={0}
          className="rt-nav"
        />
        </div>
      </div>
    );
  }

  render() {
    return (this.state.showView ? this.showCollection() : null);
  }
}

ConnectedCollection.displayName = 'ConnectedCollection';

module.exports = ConnectedCollection;
