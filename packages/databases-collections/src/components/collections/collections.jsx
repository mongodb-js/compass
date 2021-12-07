import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CollectionsList } from '@mongodb-js/databases-collections-list';
import toNS from 'mongodb-ns';

class Collections extends PureComponent {
  static propTypes = {
    collections: PropTypes.array.isRequired,
    databaseName: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    isDataLake: PropTypes.bool.isRequired,
    onCollectionClick: PropTypes.func.isRequired,
    onDeleteCollectionClick: PropTypes.func.isRequired,
    onCreateCollectionClick: PropTypes.func.isRequired,
  };

  /**
   * Render Collections component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const {
      collections,
      databaseName,
      isReadonly,
      isWritable,
      isDataLake,
      onCollectionClick,
      onDeleteCollectionClick,
      onCreateCollectionClick,
    } = this.props;

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

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  collections: (state.collections || []).map((coll) => {
    if (coll.type === 'view') {
      return {
        _id: coll._id,
        name: coll.name,
        type: coll.type,
        status: coll.status,
        source: coll.source,
        properties: coll.properties,
      };
    }
    return coll;
  }),
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
