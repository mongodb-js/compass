const React = require('react');
const app = require('ampersand-app');
const semver = require('semver');
const toNS = require('mongodb-ns');

class Collection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {activeTab: this.props.tab || 'schema'};

    this.Stats = app.appRegistry.getComponent('CollectionStats.CollectionStats');
    this.TabNav = app.appRegistry.getComponent('App.TabNavRoute');
    this.Schema = app.appRegistry.getComponent('Schema.Schema');
    this.Document = app.appRegistry.getComponent('CRUD.DocumentList');
    this.Indexes = app.appRegistry.getComponent('Indexes.Indexes');
    this.Explain = app.appRegistry.getComponent('Explain.ExplainPlan');
    this.Validation = app.appRegistry.getComponent('Validation.Validation');

    this.HomeActions = app.appRegistry.getAction('Home.Actions');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  onRouteClicked(tab) {
    this.HomeActions.navigateRoute(app.router.history.location.hash, this.props.namespace, tab);
  }

  onDBClick() {
    const dbName = toNS(this.props.namespace).database;
    this.HomeActions.navigateRoute(app.router.history.location.hash, dbName, '');
  }

  render() {
    const serverVersion = app.instance.build.version;
    const DV_ENABLED = semver.gt(serverVersion, '3.2.0-rc0');
    const tabNames = [
      'SCHEMA',
      'DOCUMENTS',
      'INDEXES',
      'EXPLAIN PLAN'
    ];
    const tabRoutes = [
      'schema',
      'documents',
      'indexes',
      'explain-plan'
    ];
    const views = [
      <this.Schema />,
      <this.Document />,
      <this.Indexes />,
      <this.Explain />
    ];
    if (DV_ENABLED) {
      tabNames.push('VALIDATION');
      tabRoutes.push('validation');
      views.push(<this.Validation />);
    }

    const database = toNS(this.props.namespace).database;
    const collection = toNS(this.props.namespace).collection;

    return (
      <div className="collection-view clearfix">
        <header>
          <div className="row">
            <div className="col-md-6">
              <h1>
                <a href="#" onClick={this.onDBClick.bind(this)}>{database}</a>.
                <span>{collection}</span>
              </h1>
            </div>
            <div className="col-md-6">
              <this.Stats />
            </div>
          </div>
        </header>
        <this.TabNav
          theme="light"
          tabNames={tabNames}
          tabRoutes={tabRoutes}
          onTabClicked={this.onRouteClicked.bind(this)}
          views={views}
          activeTab={this.state.activeTab}
          className="collection-nav"
        />
      </div>
    );
  }
}

Collection.propTypes = {
  namespace: React.PropTypes.string,
  tab: React.PropTypes.string
};

Collection.displayName = 'Collection';

module.exports = Collection;
