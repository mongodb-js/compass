import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { LOADING_STATE } from 'constants/sidebar-constants';

import classnames from 'classnames';
import styles from './sidebar-instance-stats.less';

class SidebarInstanceStats extends PureComponent {
  static displayName = 'SidebarInstanceStats';
  static propTypes = {
    instance: PropTypes.object,
    isExpanded: PropTypes.bool.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired
  };

  onRefresh = () => {
    this.props.globalAppRegistryEmit('refresh-data');
  }

  onToggleExpanded = () => {

  }

  getArrowIconClasses() {
    const expanded = this.props.isExpanded ? 'fa fa-rotate-90' : '';
    return classnames(
      'mms-icon-right-arrow',
      styles['compass-sidebar-icon'],
      styles['compass-sidebar-icon-expand'],
      expanded
    );
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
      <div className={classnames(styles['compass-sidebar-instance-stats'])}>
        <div className={classnames(styles['compass-sidebar-instance-stats-expand'])}>
          <i onClick={this.onToggleExpanded} className={this.getArrowIconClasses()} />
        </div>
        <div className={classnames(styles['compass-sidebar-instance-stats-column'])}>
          <span className={classnames(styles['compass-sidebar-instance-stats-strong-property'])}>
            {numDbs}
          </span> DBs
        </div>
        <div className={classnames(styles['compass-sidebar-instance-stats-column'])}>
          <span className={classnames(styles['compass-sidebar-instance-stats-strong-property'])}>
            {numCollections}
          </span> Collections
        </div>
        <div className={classnames(styles['compass-sidebar-instance-stats-refresh-button-container'])}>
          <button
            onClick={this.onRefresh}
            className={classnames(styles['compass-sidebar-instance-stats-refresh-button'])}>
            <i className={refreshName}/>
          </button>
        </div>
      </div>
    );
  }
}

export default SidebarInstanceStats;
