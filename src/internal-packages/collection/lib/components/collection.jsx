const React = require('react');
const app = require('ampersand-app');


class Collection extends React.Component {

  constructor(props) {
    super(props);
    this.Stats = app.appRegistry.getComponent('CollectionStats.CollectionStats');
    // query bar may need to be moved within the individual tabs for navigation to work
    this.QueryBar = app.appRegistry.getComponent('Query.QueryBar');

    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');
    this.Schema = app.appRegistry.getComponent('Schema.Schema');
    this.Document = app.appRegistry.getComponent('CRUD.DocumentList');
    this.Indexes = app.appRegistry.getComponent('Indexes.Indexes');
    this.Explain = app.appRegistry.getComponent('Explain.ExplainPlan');
    this.Validation = app.appRegistry.getComponent('Validation.Validation');
  }

  render() {
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
              <h1>{this.props.ns}</h1>
            </div>
            <div className="col-md-6">
              <this.Stats />
            </div>
          </div>
          <div className="row collection-tabs">
            <this.TabNavBar
              theme="light"
              tabs={tabs}
              views={views}
              activeTabIndex={0}
              className="collection-nav"
            />
          </div>
          <div className="row query-bar">
            <this.QueryBar />
          </div>
        </header>
      </div>
    );
  }
}

Collection.propTypes = {
  ns: React.PropTypes.string
};

Collection.displayName = 'Collection';

module.exports = Collection;
