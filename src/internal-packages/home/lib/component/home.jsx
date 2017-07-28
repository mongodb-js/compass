const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const toNS = require('mongodb-ns');
const { StatusRow } = require('hadron-react-components');
const { UI_STATES } = require('../constants');

const ERROR_WARNING = 'An error occurred while loading navigation';

/**
 * Not master error.
 */
const NOT_MASTER = 'not master and slaveOk=false';

/**
 * We recommend in the connection dialog.
 */
const RECOMMEND = 'It is recommended to change your read preference in the connection dialog';

/**
 * To switch to these read preferences.
 */
const RP_RECOMMEND = `${RECOMMEND} to Primary Preferred or Secondary Preferred`;

/**
 * Rs name message.
 */
const RS_RECOMMEND = `${RP_RECOMMEND} or provide a replica set name for a full topology connection.`;

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

  componentWillMount() {
    this.QueryHistoryComponent = global.hadronApp.appRegistry.getComponent('QueryHistory.Component');
  }

  getContentClasses() {
    return 'content' +
      (this.state.collapsed ? ' content-sidebar-collapsed' : ' content-sidebar-expanded');
  }

  getErrorMessage() {
    const message = this.props.errorMessage;
    if (message.includes(NOT_MASTER)) {
      return `'${message}': ${RS_RECOMMEND}`;
    }
    return message;
  }

  collapseSidebar() {
    this.setState({ collapsed: !this.state.collapsed });
    setTimeout(this.SchemaActions.resizeMiniCharts, COMPASS_SIDEBAR_TRANSITION_TIME_MS);

    // Probably would prefer an onChartsActivated lifecycle method here...
    const ChartActions = app.appRegistry.getAction('Chart.Actions');
    if (ChartActions !== undefined) {
      setTimeout(ChartActions.resizeChart, COMPASS_SIDEBAR_TRANSITION_TIME_MS);
    }
  }

  renderContent() {
    if (this.props.uiStatus === UI_STATES.LOADING) {
      // Handled by the <Status> component
      return null;
    }
    if (this.props.uiStatus === UI_STATES.ERROR) {
      return (
        <StatusRow style="error">
          {ERROR_WARNING}: {this.getErrorMessage()}
        </StatusRow>
      );
    }
    const ns = toNS(this.props.namespace);
    let view;
    if (ns.database === '') {
      // top of the side bar was clicked, render server stats
      view = (<this.instanceView interval={1000}/>);
    } else if (ns.collection === '') {
      // a database was clicked, render collections table
      view = (<this.collectionsTable />);
    } else {
      // show collection view
      view = (<this.collectionView namespace={this.props.namespace} />);
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
          <this.QueryHistoryComponent />
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
  errorMessage: PropTypes.string,
  namespace: PropTypes.string,
  uiStatus: PropTypes.string
};

Home.displayName = 'Home';

module.exports = Home;
