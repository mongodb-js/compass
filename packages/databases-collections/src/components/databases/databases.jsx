/* eslint-disable react/no-multi-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ZeroState } from 'hadron-react-components';
import { Banner, BannerVariant, Link, WorkspaceContainer } from '@mongodb-js/compass-components';
import { DatabasesList } from '@mongodb-js/databases-collections-list';
import { useDatabases, useDatabasesIds, useSortedDatabaseIds, isError, observer } from '@mongodb-js/compass-store';

import styles from './databases.module.less';
import { useMemo } from 'react';

const HEADER = 'Unable to display databases and collections';
const SUBTEXT =
  'This server or service appears to be emulating' +
  ' MongoDB. Some documented MongoDB features may work differently, may be' +
  ' entirely missing or incomplete, or may have unexpectedly different' +
  ' performance characteristics than would be found when connecting to a' +
  ' real MongoDB server or service.';
const DOCUMENTATION_LINK = 'https://www.mongodb.com/cloud/atlas';

const ERROR_WARNING = 'An error occurred while loading databases';

function NonGenuineZeroState() {
  return (
    <WorkspaceContainer>
      <div data-testid="databases-non-genuine-warning" className={styles['databases-non-genuine-warning']}>
        <div className="zero-graphic zero-graphic-non-genuine-mongodb" />
        <ZeroState header={HEADER} subtext={SUBTEXT}>
          <Link className={styles['databases-try-atlas-link']} href={DOCUMENTATION_LINK}>
            Try MongoDB Atlas
          </Link>
        </ZeroState>
      </div>
    </WorkspaceContainer>
  );
}

class _Databases extends PureComponent {
  static propTypes = {
    databases: PropTypes.array.isRequired,
    databasesStatus: PropTypes.string.isRequired,
    databasesError: PropTypes.string,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    isGenuineMongoDB: PropTypes.bool.isRequired,
    isDataLake: PropTypes.bool.isRequired,
    onDatabaseClick: PropTypes.func.isRequired,
    onDeleteDatabaseClick: PropTypes.func.isRequired,
    onCreateDatabaseClick: PropTypes.func.isRequired,
  };

  /**
   * Render Databases component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const {
      databases,
      databasesStatus,
      databasesError,
      isReadonly,
      isWritable,
      isDataLake,
      isGenuineMongoDB,
      onDatabaseClick,
      onDeleteDatabaseClick,
      onCreateDatabaseClick,
      onSortDatabases,
      databasesSortValue
    } = this.props;

    if (isError(databasesStatus)) {
      return (
        <div className={styles['databases-error']}>
          <Banner variant={BannerVariant.Danger}>
            {ERROR_WARNING}: {databasesError}
          </Banner>
        </div>
      );
    }

    if (databases.length === 0 && !isGenuineMongoDB) {
      return <NonGenuineZeroState />;
    }

    const actions = Object.assign(
      { onDatabaseClick },
      !isReadonly && isWritable && !isDataLake
        ? { onDeleteDatabaseClick, onCreateDatabaseClick }
        : {}
    );

    return (
      <DatabasesList
        databases={databases}
        // Only needed for Redux
        sortValue={databasesSortValue}
        onDatabasesSort={onSortDatabases}
        // ---
        {...actions}
      />
    );
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
  isReadonly: state.isReadonly,
  isWritable: state.isWritable,
  isGenuineMongoDB: state.isGenuineMongoDB,
  isDataLake: state.isDataLake,
});

function createEmit(evtName) {
  return function(...args) {
    return function(_dispatch, getState) {
      const { appRegistry } = getState();
      // eslint-disable-next-line chai-friendly/no-unused-expressions
      appRegistry?.emit(evtName, ...args);
    };
  };
}

const mapDispatchToProps = {
  onDatabaseClick: createEmit('select-database'),
  onDeleteDatabaseClick: createEmit('open-drop-database'),
  onCreateDatabaseClick: createEmit('open-create-database'),
};

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const ConnectedDatabases = connect(
  mapStateToProps,
  mapDispatchToProps
)(_Databases);


const Databases = observer(() => {
  // mobx version: there is no need to have a special ids selector to avoid
  // massive performance issues when trying to do the same with redux
  const databases = useDatabases();
  const items = Array.from(databases.items.values());

  // redux version: we are using special selector to avoid depending on the
  // actual items in the state, see databases slice for more info in the issue
  // const databases = useSortedDatabaseIds();
  // const items = databases.items;

  return (
    <ConnectedDatabases
      databases={items}
      databasesStatus={databases.status}
      databasesError={databases.error}
      // Only needed for Redux
      databasesSortValue={databases.sortValue}
      onSortDatabases={databases.onSortBy}
    />
  );
});


export default Databases;
export { Databases };
