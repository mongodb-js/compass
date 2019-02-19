import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { LOADING_STATE } from 'constants/sidebar-constants';

import classnames from 'classnames';
import styles from './sidebar-instance-properties.less';

class SidebarInstanceProperties extends PureComponent {
  static displayName = 'SidebarInstanceProperties';
  static propTypes = {
    instance: PropTypes.object
  };

  handleRefresh() {
    const InstanceActions = global.hadronApp.appRegistry.getAction(
      'App.InstanceActions'
    );
    if (InstanceActions) {
      InstanceActions.refreshInstance();
    }
  }

  render() {
    const instance = this.props.instance;
    const numDbs = instance.databases === LOADING_STATE ?
      '-' :
      instance.databases.length;
    const numCollections = instance.databases === LOADING_STATE ?
      '-' :
      instance.collections.length;
    const refreshName = 'fa ' + (this.props.instance.databases === LOADING_STATE ?
      'fa-refresh fa-spin' :
      'fa-repeat');

    return (
      <div className={classnames(styles['compass-sidebar-properties'])}>
        <div className={classnames(styles['compass-sidebar-properties-stats'])}>
          <div className={classnames(styles['compass-sidebar-properties-stats-refresh-button-container'])}>
            <button
              onClick={this.handleRefresh.bind(this)}
              className={classnames(styles['compass-sidebar-properties-stats-refresh-button'])}
              data-test-id="instance-refresh-button">
              <i className={refreshName}/>
            </button>
          </div>
          <div className={classnames(styles['compass-sidebar-properties-stats-column'])}>
            <span
              data-test-id="sidebar-db-count"
              className={classnames(styles['compass-sidebar-properties-stats-strong-property'])}>
              {numDbs}
            </span> DBs
          </div>
          <div className={classnames(styles['compass-sidebar-properties-stats-column'])}>
            <span
              data-test-id="sidebar-collection-count"
              className={classnames(styles['compass-sidebar-properties-stats-strong-property'])}>
              {numCollections}
            </span> Collections
          </div>
        </div>
      </div>
    );
  }
}

export default SidebarInstanceProperties;
