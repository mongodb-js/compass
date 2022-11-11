import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Banner, BannerVariant, EmptyContent, Link, css, spacing } from '@mongodb-js/compass-components';
import { DatabasesList } from '@mongodb-js/databases-collections-list';
import { withPreferences } from 'compass-preferences-model';

import { ZeroGraphic } from '../zero-graphic';

const errorContainerStyles = css({
  padding: spacing[3],
});

const nonGenuineErrorContainerStyles = css({
  width: '100%',
});

const NON_GENUINE_SUBTEXT =
  'This server or service appears to be emulating' +
  ' MongoDB. Some documented MongoDB features may work differently, may be' +
  ' entirely missing or incomplete, or may have unexpectedly different' +
  ' performance characteristics than would be found when connecting to a' +
  ' real MongoDB server or service.';
const DOCUMENTATION_LINK = 'https://www.mongodb.com/cloud/atlas';

const ERROR_WARNING = 'An error occurred while loading databases';

function NonGenuineZeroState() {
  return (
    <div className={nonGenuineErrorContainerStyles} data-testid="databases-non-genuine-warning">
      <EmptyContent
        icon={ZeroGraphic}
        title="Unable to display databases and collections"
        subTitle={NON_GENUINE_SUBTEXT}
        callToActionLink={
          <Link href={DOCUMENTATION_LINK}>
            Try MongoDB Atlas
          </Link>
        }
      />
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
    readOnly: PropTypes.bool,
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
      readOnly,
      isWritable,
      isDataLake,
      isGenuineMongoDB,
      onDatabaseClick,
      onDeleteDatabaseClick,
      onCreateDatabaseClick,
    } = this.props;

    if (databasesStatus.status === 'error') {
      return (
        <div className={errorContainerStyles}>
          <Banner variant={BannerVariant.Danger}>
            {ERROR_WARNING}: {databasesStatus.error}
          </Banner>
        </div>
      );
    }

    if (databases.length === 0 && !isGenuineMongoDB) {
      return <NonGenuineZeroState />;
    }

    const editable = !isReadonly && !readOnly;
    const actions = Object.assign(
      { onDatabaseClick },
      editable && isWritable && !isDataLake
        ? { onDeleteDatabaseClick, onCreateDatabaseClick }
        : {}
    );

    return <DatabasesList databases={databases} isEditable={editable} {...actions} />;
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
)(withPreferences(Databases, ['readOnly'], React));

export default ConnectedDatabases;
export { Databases };
