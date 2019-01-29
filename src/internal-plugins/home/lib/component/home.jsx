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
    this.collectionView = app.appRegistry.getRole('Collection.Workspace')[0].component;
    this.databaseView = app.appRegistry.getRole('Database.Workspace')[0].component;
    this.instanceView = app.appRegistry.getRole('Instance.Workspace')[0].component;
    this.connectView = app.appRegistry.getRole('Application.Connect')[0].component;
    this.globalModals = app.appRegistry.getRole('Global.Modal');
    this.InstanceHeader = app.appRegistry.getComponent('InstanceHeader.Component');
    this.SchemaActions = app.appRegistry.getAction('Schema.Actions');
    this.importRole = app.appRegistry.getRole('Import.Modal');
    this.exportRole = app.appRegistry.getRole('Export.Modal');
    this.exportToLangRole = app.appRegistry.getRole('ExportToLanguage.Modal');
    this.findInPageRole = app.appRegistry.getRole('Find');
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
    if (this.SchemaActions) {
      setTimeout(this.SchemaActions.resizeMiniCharts, COMPASS_SIDEBAR_TRANSITION_TIME_MS);
    }

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
      view = (<this.databaseView />);
    } else {
      // show collection view
      view = (<this.collectionView namespace={this.props.namespace} />);
    }
    return view;
  }

  renderConnect() {
    return (
      <div className="page-container" data-test-id="home-view">
        <div className="page">
          <this.connectView />
        </div>
      </div>
    );
  }

  renderImportModal() {
    if (this.importRole) {
      const Import = this.importRole[0].component;
      return (<Import />);
    }
  }

  renderExportModal() {
    if (this.exportRole) {
      const Export = this.exportRole[0].component;
      return (<Export />);
    }
  }
  renderFindInPage() {
    if (this.findInPageRole) {
      const Find = this.findInPageRole[0].component;
      return (<Find/>);
    }
  }

  renderExportToLangModal() {
    if (this.exportToLangRole) {
      const ExportToLanguage = this.exportToLangRole[0].component;
      return (<ExportToLanguage />);
    }
  }

  renderGlobalModals() {
    if (this.globalModals) {
      return this.globalModals.map((globalModal, index) => {
        const GlobalModal = globalModal.component;
        return (<GlobalModal key={index} />);
      });
    }
  }

  renderHome() {
    return (
      <div className="page-container" data-test-id="home-view">
        <this.InstanceHeader sidebarCollapsed={this.state.collapsed}/>
        <div className="page">
          <div className={this.getContentClasses()}>
            {this.renderContent()}
          </div>
          <this.sideBar onCollapse={this.collapseSidebar.bind(this)}/>
          <this.QueryHistoryComponent />
          {this.renderImportModal()}
          {this.renderExportModal()}
          {this.renderExportToLangModal()}
          {this.renderFindInPage()}
          {this.renderGlobalModals()}
        </div>
      </div>
    );
  }

  render() {
    if (this.props.isConnected) {
      return this.renderHome();
    }
    return this.renderConnect();
  }
}

Home.propTypes = {
  errorMessage: PropTypes.string,
  namespace: PropTypes.string,
  uiStatus: PropTypes.string,
  isConnected: PropTypes.bool
};

Home.displayName = 'Home';

module.exports = Home;
