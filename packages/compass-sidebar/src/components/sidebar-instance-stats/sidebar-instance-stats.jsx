import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import styles from './sidebar-instance-stats.module.less';

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
    const { instance } = this.props;

    let numDbs = instance?.databases.length ?? 0;
    let numCollections =
      instance?.databases
        .map((db) => db.collection_count ?? 0)
        .reduce((acc, n) => acc + n, 0) ?? 0;

    let refreshClassName = 'fa fa-repeat';

    const isRefreshing = instance?.isRefreshing ?? false;
    const isInitialOrInitialFetching =
      !instance || ['initial', 'fetching'].includes(instance?.status);

    if (isRefreshing) {
      refreshClassName = 'fa fa-refresh fa-spin';
    }

    if (isInitialOrInitialFetching) {
      numDbs = '-';
      numCollections = '-';
    }

    return (
      <div className={styles['sidebar-instance-stats']}>
        <div
          className={styles['sidebar-instance-stats-expand']}
          onClick={this.onToggleExpanded}>
          <i className={this.getArrowIconClasses()} />
        </div>
        <div className={styles['sidebar-instance-stats-column']}>
          <span
            id="sidebar-instance-stats-dbs"
            className={styles['sidebar-instance-stats-strong-property']}>
            {numDbs}
          </span> DBs
        </div>
        <div className={styles['sidebar-instance-stats-column']}>
          <span
            id="sidebar-instance-stats-collections"
            className={styles['sidebar-instance-stats-strong-property']}>
            {numCollections}
          </span> Collections
        </div>
        <div className={styles['sidebar-instance-stats-refresh-button-container']}>
          <button
            onClick={this.onRefresh}
            className={styles['sidebar-instance-stats-refresh-button']}
            disabled={isRefreshing}
          >
            <i className={refreshClassName}/>
          </button>
        </div>
      </div>
    );
  }
}

export default SidebarInstanceStats;
