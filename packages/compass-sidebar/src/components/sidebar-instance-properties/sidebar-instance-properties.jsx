import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { LOADING_STATE } from 'constants/sidebar-constants';

// import classnames from 'classnames';
// import styles from './sidebar-instance-properties.less';

class SidebarInstanceProperties extends PureComponent {
  static displayName = 'SidebarInstanceProperties';
  static propTypes = {
    instance: PropTypes.object,
    activeNamespace: PropTypes.string.isRequired
  };

  getRefreshIconClassNames() {
    const fetchingInstance = this.props.instance.databases === LOADING_STATE;
    return 'fa ' + (fetchingInstance ? 'fa-refresh fa-spin' : 'fa-repeat');
  }

  handleRefresh() {
    const InstanceActions = global.hadronApp.appRegistry.getAction('App.InstanceActions');
    InstanceActions ? InstanceActions.refreshInstance() : '';
  }

  render() {
    const instance = this.props.instance;
    const numDbs = instance.databases === LOADING_STATE ? '-' : instance.databases.length;
    const numCollections = instance.collections === LOADING_STATE ? '-' : instance.collections.length;

    return (
      <div className="compass-sidebar-properties">
        <div className="compass-sidebar-stats">
          <div className="compass-sidebar-refresh-button-container">
            <button
              onClick={this.handleRefresh.bind(this)}
              className="compass-sidebar-refresh-button"
              data-test-id="instance-refresh-button">
              <i className={this.getRefreshIconClassNames()}></i>
            </button>
          </div>
          <div className="compass-sidebar-property-column">
            <span
              data-test-id="sidebar-db-count"
              className="compass-sidebar-strong-property">
              {numDbs}
            </span> DBs
          </div>
          <div className="compass-sidebar-property-column">
            <span
              data-test-id="sidebar-collection-count"
              className="compass-sidebar-strong-property">
              {numCollections}
            </span> Collections
          </div>
        </div>
      </div>
    );
  }
}

export default SidebarInstanceProperties;
