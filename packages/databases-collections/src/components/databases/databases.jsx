/* eslint-disable react/no-multi-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ZeroState } from 'hadron-react-components';
import { Banner, BannerVariant, Link, WorkspaceContainer } from '@mongodb-js/compass-components';
import { DatabasesList } from '@mongodb-js/databases-collections-list';

import styles from './databases.module.less';

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
    <div data-testid="databases-non-genuine-warning" className={styles['databases-non-genuine-warning']}>
      <div className="zero-graphic zero-graphic-non-genuine-mongodb" />
      <ZeroState header={HEADER} subtext={SUBTEXT}>
        <Link className={styles['databases-try-atlas-link']} href={DOCUMENTATION_LINK}>
          Try MongoDB Atlas
        </Link>
      </ZeroState>
    </div>
  );
}

class Databases extends PureComponent {
  static propTypes = {
    databases: PropTypes.array.isRequired,
    databasesStatus: PropTypes.object.isRequired,
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
      isReadonly,
      isWritable,
      isDataLake,
      isGenuineMongoDB,
      onDatabaseClick,
      onDeleteDatabaseClick,
      onCreateDatabaseClick,
    } = this.props;

    if (databasesStatus.status === 'error') {
      return (
        <div className={styles['databases-error']}>
          <Banner variant={BannerVariant.Danger}>
            {ERROR_WARNING}: {databasesStatus.error}
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

    return <DatabasesList databases={databases} {...actions} />;
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
  databases: state.databases,
  databasesStatus: state.databasesStatus,
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
)(Databases);

export default ConnectedDatabases;
export { Databases };
