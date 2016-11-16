const React = require('react');
const app = require('ampersand-app');
const toNS = require('mongodb-ns');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
// const debug = require('debug')('component:collection');

class Collection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      showView: false
    };
    this.Stats = app.appRegistry.getComponent('CollectionStats.CollectionStats');

    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');

    this.Schema = app.appRegistry.getComponent('Schema.Schema');
    this.Document = app.appRegistry.getComponent('CRUD.DocumentList');
    this.Indexes = app.appRegistry.getComponent('Indexes.Indexes');
    this.Explain = app.appRegistry.getComponent('Explain.ExplainPlan');
    this.Validation = app.appRegistry.getComponent('Validation.Validation');

    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this.setState({name: toNS(ns).collection, showView: true});
      } else {
        this.setState({name: '', showView: false});
      }
    });
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
          activeTabIndex={0}
          className=""
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
