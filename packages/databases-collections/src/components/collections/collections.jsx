/* eslint-disable react/no-multi-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CollectionsList } from '@mongodb-js/databases-collections-list';
import toNS from 'mongodb-ns';
import { Banner, BannerVariant } from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isError, useCollectionsForDatabase } from '@mongodb-js/compass-store';

import styles from './collections.module.less';

const ERROR_WARNING = 'An error occurred while loading collections';

const { track } = createLoggerAndTelemetry('COMPASS-COLLECTIONS-UI');

class _Collections extends PureComponent {
  static propTypes = {
    collections: PropTypes.array.isRequired,
    collectionsStatus: PropTypes.string.isRequired,
    collectionsError: PropTypes.string,
    databaseName: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    isDataLake: PropTypes.bool.isRequired,
    onCollectionClick: PropTypes.func.isRequired,
    onDeleteCollectionClick: PropTypes.func.isRequired,
    onCreateCollectionClick: PropTypes.func.isRequired,
  };

  componentDidMount() {
    track('Screen', { name: 'collections' });
  }

  /**
   * Render Collections component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const {
      collections,
      collectionsStatus,
      collectionsError,
      databaseName,
      isReadonly,
      isWritable,
      isDataLake,
      onCollectionClick,
      onDeleteCollectionClick,
      onCreateCollectionClick,
    } = this.props;

    if (isError(collectionsStatus)) {
      return (
        <div className={styles['collections-error']}>
          <Banner variant={BannerVariant.Danger}>
            {ERROR_WARNING}: {collectionsError}
          </Banner>
        </div>
      );
    }

    const actions = Object.assign(
      { onCollectionClick },
      !isReadonly && isWritable && !isDataLake
        ? { onDeleteCollectionClick, onCreateCollectionClick }
        : {}
    );

    return (
      <CollectionsList
        key={databaseName}
        collections={collections}
        {...actions}
      />
    );
  }
}

const Collections = ({
  databaseName,
  isReadonly,
  isWritable,
  isDataLake,
  isGenuineMongoDB,
}) => {
  const collections = useCollectionsForDatabase(databaseName);
  return (
    <_Collections
      databaseName={databaseName}
      collections={collections.items}
      collectionsStatus={collections.status}
      // TODO
      collectionsError={null}
      isReadonly={isReadonly}
      isWritable={isWritable}
      isDataLake={isDataLake}
      isGenuineMongoDB={isGenuineMongoDB}
    />
  );
};

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  databaseName: state.databaseName,
  isReadonly: state.isReadonly,
  isWritable: state.isWritable,
  isDataLake: state.isDataLake,
  isGenuineMongoDB: state.isGenuineMongoDB,
});

function createEmit(evtName) {
  return function(ns) {
    return function(_dispatch, getState) {
      const { appRegistry, databaseName } = getState();
      // eslint-disable-next-line chai-friendly/no-unused-expressions
      appRegistry?.emit(evtName, toNS(ns ?? databaseName));
    };
  };
}

const mapDispatchToProps = {
  onCollectionClick: createEmit('collections-list-select-collection'),
  onDeleteCollectionClick: createEmit('open-drop-collection'),
  onCreateCollectionClick: createEmit('open-create-collection'),
};

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const ConnectedCollections = connect(
  mapStateToProps,
  mapDispatchToProps
)(Collections);

export default ConnectedCollections;
export { Collections };
