import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import styles from './sidebar-instance-stats.module.less';

class SidebarInstanceStats extends PureComponent {
  static propTypes = {
    instance: PropTypes.object.isRequired,
    databases: PropTypes.array,
    isExpanded: PropTypes.bool.isRequired,
    toggleIsExpanded: PropTypes.func.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired,
  };

  onRefresh = () => {
    this.props.globalAppRegistryEmit('refresh-data');
  };

  onToggleExpanded = () => {
    this.props.toggleIsExpanded(!this.props.isExpanded);
  };

  getArrowIconClasses() {
    const expanded = this.props.isExpanded ? 'fa fa-rotate-90' : '';
    return classnames('mms-icon-right-arrow', expanded);
  }

  render() {
    const { instance, databases } = this.props;

    let numDbs = databases.length;
    let numCollections = databases
      .map((db) => db.collectionsLength)
      .reduce((acc, n) => acc + n, 0);

    let refreshClassName = 'fa fa-repeat';

    const isRefreshing =
      !instance ||
      ['initial', 'fetching', 'refreshing'].includes(instance.refreshingStatus);

    const isInitialOrInitialFetching =
      !instance || ['initial', 'fetching'].includes(instance.refreshingStatus);

    if (isRefreshing) {
      refreshClassName = 'fa fa-refresh fa-spin';
    }

    if (isInitialOrInitialFetching) {
      numDbs = '-';
      numCollections = '-';
    }

    return (
      // TODO: https://jira.mongodb.org/browse/COMPASS-5918
      /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
      <div className={styles['sidebar-instance-stats']}>
        <div
          className={styles['sidebar-instance-stats-expand']}
          onClick={this.onToggleExpanded}
        >
          <i className={this.getArrowIconClasses()} />
        </div>
        <div className={styles['sidebar-instance-stats-column']}>
          <span
            id="sidebar-instance-stats-dbs"
            className={styles['sidebar-instance-stats-strong-property']}
          >
            {numDbs}
          </span>{' '}
          DBs
        </div>
        <div className={styles['sidebar-instance-stats-column']}>
          <span
            id="sidebar-instance-stats-collections"
            className={styles['sidebar-instance-stats-strong-property']}
          >
            {numCollections}
          </span>{' '}
          Collections
        </div>
        <div
          className={styles['sidebar-instance-stats-refresh-button-container']}
        >
          <button
            onClick={this.onRefresh}
            data-test-id="sidebar-instance-stats-refresh-button"
            className={styles['sidebar-instance-stats-refresh-button']}
            disabled={isRefreshing}
          >
            <i
              className={refreshClassName}
              data-test-id={`sidebar-instance-stats-refresh-${
                isRefreshing ? 'spinning' : 'idle'
              }`}
            />
          </button>
        </div>
      </div>
      /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
    );
  }
}

export default SidebarInstanceStats;
