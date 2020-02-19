/* eslint-disable react/sort-comp */

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import toNS from 'mongodb-ns';
import { StatusRow } from 'hadron-react-components';
import UI_STATES from 'constants/ui-states';

const debug = require('debug')('mongodb-compass:stores:HomeComponent');

import { toggleIsCollapsed } from 'modules/is-collapsed';

import classnames from 'classnames';
import styles from './home.less';

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

class Home extends PureComponent {
  static displayName = 'HomeComponent';

  static propTypes = {
    errorMessage: PropTypes.string,
    namespace: PropTypes.string,
    uiStatus: PropTypes.string,
    isConnected: PropTypes.bool,
    isCollapsed: PropTypes.bool,
    toggleIsCollapsed: PropTypes.func,
    isDataLake: PropTypes.bool
  };

  getComponentOrNull(name) {
    const component = global.hadronApp.appRegistry.getComponent(name);
    if (!component) debug(`home plugin loading component, but ${name} is NULL`);
    return component ? component : null;
  }
  getRoleOrNull(name) {
    const role = global.hadronApp.appRegistry.getRole(name);
    if (!role) debug(`home plugin loading role, but ${name} is NULL`);
    return role ? role : null;
  }
  getActionOrNull(name) {
    const action = global.hadronApp.appRegistry.getAction(name);
    return action ? action : null;
  }


  constructor(props) {
    super(props);
    this.SidebarComponent = this.getComponentOrNull('Sidebar.Component');
    this.connectRole = this.getRoleOrNull('Application.Connect');
    this.SchemaActions = this.getActionOrNull('Schema.Actions');

    this.collectionRole = this.getRoleOrNull('Collection.Workspace');
    this.databaseRole = this.getRoleOrNull('Database.Workspace');
    this.instanceRole = this.getRoleOrNull('Instance.Workspace');
    this.globalModals = this.getRoleOrNull('Global.Modal');
    this.globalWarnings = this.getRoleOrNull('Global.Warning');
    this.findInPageRole = this.getRoleOrNull('Find');
  }

  componentWillMount() {
    this.QueryHistoryComponent = this.getComponentOrNull('QueryHistory.Component');
  }

  getContentClasses() {
    const collapsed = this.props.isCollapsed ?
      'content-sidebar-collapsed' :
      'content-sidebar-expanded';
    return classnames(
      styles['home-view-page-content'],
      collapsed
    );
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
    global.hadronApp.appRegistry.emit('sidebar-toggle');
  }

  renderCollectionView() {
    if (this.collectionRole) {
      const Collection = this.collectionRole[0].component;
      return (<Collection namespace={this.props.namespace} isDataLake={this.props.isDataLake}/>);
    }
    return null;
  }

  renderDatabaseView() {
    if (this.databaseRole) {
      const Database = this.databaseRole[0].component;
      return (<Database />);
    }
    return null;
  }

  renderInstanceView() {
    if (this.instanceRole) {
      const Instance = this.instanceRole[0].component;
      return (<Instance interval={1000} isDataLake={this.props.isDataLake}/>);
    }
    return null;
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
    if (ns.database === '') {
      // top of the side bar was clicked, render server stats
      return this.renderInstanceView();
    } else if (ns.collection === '') {
      // a database was clicked, render collections table
      return this.renderDatabaseView();
    }
    // show collection view
    return this.renderCollectionView();
  }

  renderFindInPage() {
    if (this.findInPageRole) {
      const Find = this.findInPageRole[0].component;
      return (<Find/>);
    }
    return null;
  }

  renderGlobalModals() {
    if (this.globalModals) {
      return this.globalModals.map((globalModal, index) => {
        const GlobalModal = globalModal.component;
        return (<GlobalModal key={index} />);
      });
    }
    return null;
  }

  renderGlobalWarnings() {
    if (this.globalWarnings) {
      return this.globalWarnings.map((globalWarning, index) => {
        const GlobalWarning = globalWarning.component;
        return (<GlobalWarning key={index} />);
      });
    }
  }

  renderSidebar() {
    if (this.SidebarComponent) {
      return (
        <this.SidebarComponent onCollapse={this.collapseSidebar.bind(this)}/>
      );
    }
    return null;
  }

  renderHome() {
    return (
      <div className={classnames(styles['home-view'])} data-test-id="home-view">
        <div className={classnames(styles['home-view-page'])}>
          <div className={this.getContentClasses()}>
            {this.renderContent()}
          </div>
          {this.renderSidebar()}
          {this.renderFindInPage()}
          {this.renderGlobalModals()}
          {this.renderGlobalWarnings()}
        </div>
      </div>
    );
  }

  renderConnect() {
    if (this.connectRole) {
      const Connect = this.connectRole[0].component;
      return (
        <div className={classnames(styles['home-view'])} data-test-id="home-view">
          <div className={classnames(styles['home-view-page'])}>
            <Connect />
            {this.renderGlobalWarnings()}
          </div>
        </div>
      );
    }
    return null;
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
  isCollapsed: state.isCollapsed,
  isDataLake: state.isDataLake
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
