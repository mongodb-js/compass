import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import {
  ResizeHandle,
  ResizeDirection,
  ThemeProvider,
  Theme,
} from '@mongodb-js/compass-components';

import classnames from 'classnames';
import styles from './sidebar.module.less';

import SidebarTitle from '../sidebar-title';
import SidebarInstance from '../sidebar-instance';
import NonGenuineWarningModal from '../non-genuine-warning-modal';
import SidebarDatabasesNavigation from '../sidebar-databases-navigation';

import { toggleIsDetailsExpanded } from '../../modules/is-details-expanded';
import { toggleIsGenuineMongoDBVisible } from '../../modules/is-genuine-mongodb-visible';
import { changeFilterRegex } from '../../modules/databases';
import { updateAndSaveConnectionInfo } from '../../modules/connection-info';
import { NavigationItems } from './navigation-items';

// In pixels. (px)
const sidebarWidthCollapsed = 36;
const sidebarMinWidthOpened = 160;
const defaultSidebarWidthOpened = 250;

function getMaxSidebarWidth() {
  return Math.max(sidebarMinWidthOpened, window.innerWidth - 100);
}

// Apply bounds to the sidebar width when resizing to ensure it's always
// visible and usable to the user.
function boundSidebarWidth(attemptedWidth) {
  const maxWidth = getMaxSidebarWidth();

  return Math.min(maxWidth, Math.max(sidebarMinWidthOpened, attemptedWidth));
}

class Sidebar extends PureComponent {
  static displayName = 'Sidebar';
  static propTypes = {
    // Sidebar is a global plugin and will be instantiated before the instance
    // is available. Therefore instance cannot be required.
    instance: PropTypes.object,
    databases: PropTypes.array.isRequired,
    isDetailsExpanded: PropTypes.bool.isRequired,
    toggleIsDetailsExpanded: PropTypes.func.isRequired,
    changeFilterRegex: PropTypes.func.isRequired,
    isGenuineMongoDBVisible: PropTypes.bool.isRequired,
    toggleIsGenuineMongoDBVisible: PropTypes.func.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired,
    connectionInfo: PropTypes.object.isRequired,
    connectionOptions: PropTypes.object.isRequired,
    updateAndSaveConnectionInfo: PropTypes.func.isRequired,
  };

  state = {
    width: defaultSidebarWidthOpened,
    prevWidth: defaultSidebarWidthOpened,
    // The old sidebar is always dark
    theme: { theme: Theme.Dark },
  };

  onNavigationItemClick(tabName) {
    this.props.globalAppRegistryEmit('open-instance-workspace', tabName);
  }

  updateWidth(width) {
    this.setState(
      width > sidebarMinWidthOpened
        ? {
            width,
            // Store the previous width to use when toggling open/close
            // when we resize while the sidebar is expanded.
            prevWidth: width,
          }
        : {
            width,
          }
    );
  }

  handleSearchFocus() {
    if (this.state.width < sidebarMinWidthOpened) {
      // Expand the sidebar when it's collapsed and search is clicked.
      this.updateWidth(this.state.prevWidth);
    }

    // TODO: https://jira.mongodb.org/browse/COMPASS-5918
    // eslint-disable-next-line react/no-string-refs
    this.refs.filter.focus();
  }

  handleFilter(event) {
    const searchString = event.target.value;

    let re;

    try {
      re = searchString ? new RegExp(searchString, 'i') : null;
    } catch (e) {
      re = null;
    }

    this.props.changeFilterRegex(re);
  }

  handleCreateDatabaseClick(isWritable) {
    if (isWritable) {
      this.props.globalAppRegistryEmit('open-create-database');
    }
  }

  handleSetConnectionIsCSFLEEnabled(enabled) {
    this.props.globalAppRegistryEmit('sidebar-toggle-csfle-enabled', enabled);
  }

  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
  }

  renderCreateDatabaseButton() {
    if (!this.isReadonlyDistro() && !this.props.instance.dataLake.isDataLake) {
      const isW = !this.props.instance.isWritable
        ? styles['compass-sidebar-button-is-disabled']
        : '';
      const className = classnames(
        styles['compass-sidebar-button-create-database'],
        styles[isW]
      );
      return (
        <div
          className={classnames(
            styles['compass-sidebar-button-create-database-container']
          )}
        >
          <button
            className={className}
            title="Create Database"
            data-test-id="create-database-button"
            onClick={this.handleCreateDatabaseClick.bind(
              this,
              this.props.instance.isWritable
            )}
          >
            <i className="mms-icon-add" />
            <div className={classnames(styles['plus-button'])}>
              Create Database
            </div>
          </button>
        </div>
      );
    }
  }

  render() {
    const { width, prevWidth } = this.state;

    const isExpanded = width > sidebarMinWidthOpened;
    const renderedWidth = isExpanded
      ? boundSidebarWidth(width)
      : sidebarWidthCollapsed;

    const collapsedButton =
      'fa' + (isExpanded ? ' fa-caret-left' : ' fa-caret-right');

    // TODO: https://jira.mongodb.org/browse/COMPASS-5918
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/no-string-refs */

    return (
      <ThemeProvider theme={this.state.theme}>
        <div
          className={classnames(styles['compass-sidebar'], {
            [styles['compass-sidebar-collapsed']]: !isExpanded,
          })}
          data-test-id="compass-sidebar-panel"
          style={{ width: renderedWidth }}
        >
          <ResizeHandle
            onChange={(newWidth) => this.updateWidth(newWidth)}
            direction={ResizeDirection.RIGHT}
            value={width}
            minValue={sidebarWidthCollapsed}
            maxValue={getMaxSidebarWidth()}
            title="sidebar"
          />
          <button
            className={classnames(
              styles['compass-sidebar-toggle'],
              'btn btn-default btn-sm'
            )}
            onClick={() =>
              isExpanded
                ? this.updateWidth(sidebarWidthCollapsed)
                : this.updateWidth(prevWidth)
            }
            data-test-id="toggle-sidebar"
          >
            <i className={collapsedButton} />
          </button>
          <SidebarTitle
            connectionInfo={this.props.connectionInfo}
            isSidebarExpanded={isExpanded}
            onClick={() => this.onNavigationItemClick()}
          />
          {isExpanded && this.props.instance && (
            <SidebarInstance
              instance={this.props.instance}
              databases={this.props.databases}
              isExpanded={this.props.isDetailsExpanded}
              isGenuineMongoDB={this.props.instance.genuineMongoDB.isGenuine}
              toggleIsDetailsExpanded={this.props.toggleIsDetailsExpanded}
              globalAppRegistryEmit={this.props.globalAppRegistryEmit}
              connectionInfo={this.props.connectionInfo}
              connectionOptions={this.props.connectionOptions}
              updateConnectionInfo={this.props.updateAndSaveConnectionInfo}
              setConnectionIsCSFLEEnabled={(enabled) =>
                this.handleSetConnectionIsCSFLEEnabled(enabled)
              }
            />
          )}
          <NavigationItems
            onItemClick={(tabName) => this.onNavigationItemClick(tabName)}
            isExpanded={isExpanded}
          />
          <div
            className={styles['compass-sidebar-filter']}
            onClick={this.handleSearchFocus.bind(this)}
          >
            <i
              className={classnames(
                'fa',
                'fa-search',
                styles['compass-sidebar-search-icon']
              )}
            />
            <input
              data-test-id="sidebar-filter-input"
              ref="filter"
              className={styles['compass-sidebar-search-input']}
              placeholder="Filter your data"
              onChange={this.handleFilter.bind(this)}
            />
          </div>
          <div className={styles['compass-sidebar-content']}>
            {isExpanded && <SidebarDatabasesNavigation />}
            {this.props.instance && this.renderCreateDatabaseButton()}
          </div>
          <NonGenuineWarningModal
            isVisible={this.props.isGenuineMongoDBVisible}
            toggleIsVisible={this.props.toggleIsGenuineMongoDBVisible}
          />
        </div>
      </ThemeProvider>
    );
    /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/no-string-refs */
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
  connectionInfo: state.connectionInfo.connectionInfo,
  connectionOptions: state.connectionOptions,
  instance: state.instance,
  databases: state.databases.databases,
  isDetailsExpanded: state.isDetailsExpanded,
  isGenuineMongoDBVisible: state.isGenuineMongoDBVisible,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedSidebar = connect(mapStateToProps, {
  toggleIsDetailsExpanded,
  toggleIsGenuineMongoDBVisible,
  changeFilterRegex,
  globalAppRegistryEmit,
  updateAndSaveConnectionInfo,
})(Sidebar);

export default MappedSidebar;
export { Sidebar };
