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
    toggleIsExpanded: PropTypes.func.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired
  };

  onRefresh = () => {
    this.props.globalAppRegistryEmit('refresh-data');
  }

  onToggleExpanded = () => {
    this.props.toggleIsExpanded(!this.props.isExpanded);
  }

  getArrowIconClasses() {
    const expanded = this.props.isExpanded ? 'fa fa-rotate-90' : '';
    return classnames('mms-icon-right-arrow', expanded);
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
      <div className={classnames(styles['sidebar-instance-stats'])}>
        <div
          className={classnames(styles['sidebar-instance-stats-expand'])}
          onClick={this.onToggleExpanded}>
          <i className={this.getArrowIconClasses()} />
        </div>
        <div className={classnames(styles['sidebar-instance-stats-column'])}>
          <span
            id="sidebar-instance-stats-dbs"
            className={classnames(styles['sidebar-instance-stats-strong-property'])}>
            {numDbs}
          </span> DBs
        </div>
        <div className={classnames(styles['sidebar-instance-stats-column'])}>
          <span
            id="sidebar-instance-stats-collections"
            className={classnames(styles['sidebar-instance-stats-strong-property'])}>
            {numCollections}
          </span> Collections
        </div>
        <div className={classnames(styles['sidebar-instance-stats-refresh-button-container'])}>
          <button
            onClick={this.onRefresh}
            className={classnames(styles['sidebar-instance-stats-refresh-button'])}>
            <i className={refreshName}/>
          </button>
        </div>
      </div>
    );
  }
}

export default SidebarInstanceStats;
