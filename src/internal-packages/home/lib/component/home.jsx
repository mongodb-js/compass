const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const { UI_STATES } = require('../constants');

/**
 * Resize minicharts after sidebar has finished collapsing, should be the same
 * as the "@compass-sidebar-transition-time" variable in sidebar styles
 */
const COMPASS_SIDEBAR_TRANSITION_TIME_MS = 400;

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { collapsed: false };
    this.sideBar = app.appRegistry.getComponent('Sidebar.Component');
    this.collectionView = app.appRegistry.getComponent('Collection.Collection');
    this.collectionsTable = app.appRegistry.getComponent('Database.CollectionsTable');
    /**
     * TODO (imlucas) Handle state when rtss permissions not available.
     */
    this.instanceView = app.appRegistry.getComponent('Instance.Instance');
    this.CreateDatabaseDialog = app.appRegistry.getComponent('DatabaseDDL.CreateDatabaseDialog');
    this.DropDatabaseDialog = app.appRegistry.getComponent('DatabaseDDL.DropDatabaseDialog');
    this.CreateCollectionDialog = app.appRegistry.getComponent('Database.CreateCollectionDialog');
    this.DropCollectionDialog = app.appRegistry.getComponent('Database.DropCollectionDialog');
    this.InstanceHeader = app.appRegistry.getComponent('InstanceHeader.Component');
    this.SchemaActions = app.appRegistry.getAction('Schema.Actions');
  }

  getContentClasses() {
    return 'content' +
      (this.state.collapsed ? ' content-sidebar-collapsed' : ' content-sidebar-expanded');
  }

  collapseSidebar() {
    this.setState({ collapsed: !this.state.collapsed });
    setTimeout(this.SchemaActions.resizeMiniCharts, COMPASS_SIDEBAR_TRANSITION_TIME_MS);
  }

  renderLoadingState() {
    return (
      <div className="home-loading">
        <div className="spinner">
          <div className="rect1" />
          <div className="rect2" />
          <div className="rect3" />
          <div className="rect4" />
          <div className="rect5" />
        </div>
        <p className="message">
          Loading navigation
        </p>
      </div>
    );
  }

  renderContent() {
    if (this.props.uiStatus === UI_STATES.LOADING) {
      return this.renderLoadingState();
    }

    let view;
    switch (this.props.mode) {
      case 'database':
        view = (<this.collectionsTable />);
        break;
      case 'collection':
        view = (<this.collectionView namespace={this.props.namespace} />);
        break;
      default:
        view = (<this.instanceView interval={1000}/>);
    }

    return view;
  }

  render() {
    return (
      <div className="page-container" data-test-id="home-view">
        <this.InstanceHeader sidebarCollapsed={this.state.collapsed}/>
        <div className="page">
          <div className={this.getContentClasses()}>
            {this.renderContent()}
          </div>
          <this.sideBar onCollapse={this.collapseSidebar.bind(this)}/>
          <this.CreateDatabaseDialog />
          <this.DropDatabaseDialog />
          <this.CreateCollectionDialog />
          <this.DropCollectionDialog />
        </div>
      </div>
    );
  }
}

Home.propTypes = {
  mode: PropTypes.oneOf(['instance', 'database', 'collection']),
  namespace: PropTypes.string,
  uiStatus: PropTypes.string
};

Home.displayName = 'Home';

module.exports = Home;
