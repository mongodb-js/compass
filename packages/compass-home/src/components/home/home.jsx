/* eslint-disable react/sort-comp */

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import toNS from 'mongodb-ns';
import { StatusRow } from 'hadron-react-components';
import UI_STATES from 'constants/ui-states';

import toggleIsCollapsed from 'modules/is-collapsed';

// import classnames from 'classnames';
// import styles from './home.less';

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

class Home extends PureComponent {
  static displayName = 'HomeComponent';

  static propTypes = {
    errorMessage: PropTypes.string,
    namespace: PropTypes.string,
    uiStatus: PropTypes.string,
    isConnected: PropTypes.bool,
    isCollapsed: PropTypes.bool,
    toggleIsCollapsed: PropTypes.func
  };

  getComponentOrNull(name) {
    const component = global.hadronApp.appRegistry.getComponent(name);
    if (!component) console.log(`${name} is NULL`);
    return component ? component : null;
  }
  getRoleOrNull(name) {
    const role = global.hadronApp.appRegistry.getRole(name);
    if (!role) console.log(`${name} is NULL`);
    return role ? role : null;
  }
  getActionOrNull(name) {
    const action = global.hadronApp.appRegistry.getAction(name);
    if (!action) console.log(`${name} is NULL`);
    return action ? action : null;
  }


  constructor() {
    super();
    this.sideBar = this.getComponentOrNull('Sidebar.Component');
    this.connectView = this.getRoleOrNull('Application.Connect')[0].component;
    this.SchemaActions = this.getActionOrNull('Schema.Actions');

    this.collectionView = this.getRoleOrNull('Collection.Workspace')[0].component;
    this.databaseView = this.getRoleOrNull('Database.Workspace')[0].component;
    this.instanceView = this.getRoleOrNull('Instance.Workspace')[0].component;
    this.globalModals = this.getRoleOrNull('Global.Modal');
    this.InstanceHeader = this.getComponentOrNull('InstanceHeader.Component');
    this.importRole = this.getRoleOrNull('Import.Modal');
    this.exportRole = this.getRoleOrNull('Export.Modal');
    this.exportToLangRole = this.getRoleOrNull('ExportToLanguage.Modal');
    this.findInPageRole = this.getRoleOrNull('Find');
  }

  componentWillMount() {
    this.QueryHistoryComponent = this.getComponentOrNull('QueryHistory.Component');
  }

  getContentClasses() {
    return 'content' +
      (this.props.isCollapsed ? ' content-sidebar-collapsed' : ' content-sidebar-expanded');
  }

  getErrorMessage() {
    const message = this.props.errorMessage;
    if (message.includes(NOT_MASTER)) {
      return `'${message}': ${RS_RECOMMEND}`;
    }
    return message;
  }

  collapseSidebar() {
    this.props.toggleIsCollapsed(!this.props.isCollapsed);
    if (this.SchemaActions) {
      setTimeout(this.SchemaActions.resizeMiniCharts, COMPASS_SIDEBAR_TRANSITION_TIME_MS);
    }

    // Probably would prefer an onChartsActivated lifecycle method here...
    const ChartActions = global.hadronApp.appRegistry.getAction('Chart.Actions');
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

  renderInstanceHeader() {
    if (this.InstanceHeader) {
      return (
        <this.InstanceHeader sidebarCollapsed={this.props.isCollapsed}/>
      );
    }
  }

  renderHome() {
    return (
      <div className="page-container" data-test-id="home-view">
        {this.renderInstanceHeader()}
        <div className="page">
          <div className={this.getContentClasses()}>
            {this.renderContent()}
          </div>
          {<this.sideBar onCollapse={this.collapseSidebar.bind(this)}/>}
          {/* <this.QueryHistoryComponent /> */}
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


/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  errorMessage: state.errorMessage,
  namespace: state.namespace,
  uiStatus: state.uiStatus,
  isConnected: state.isConnected,
  isCollapsed: state.isCollapsed
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedHome = connect(
  mapStateToProps,
  {
    toggleIsCollapsed
  },
)(Home);

export default MappedHome;
export { Home };
