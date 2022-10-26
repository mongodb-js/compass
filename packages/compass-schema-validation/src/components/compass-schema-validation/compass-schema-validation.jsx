import React, { Component } from 'react';
import { connect } from 'react-redux';
import ValidationStates from '../validation-states';
import {
  validatorChanged,
  cancelValidation,
  saveValidation,
  validationActionChanged,
  validationLevelChanged,
} from '../../modules/validation';
import { namespaceChanged } from '../../modules/namespace';
import { fetchSampleDocuments } from '../../modules/sample-documents';
import { changeZeroState, zeroStateChanged } from '../../modules/zero-state';

import styles from './compass-schema-validation.module.less';

/**
 * The core schema validation component.
 */
class CompassSchemaValidation extends Component {
  static displayName = 'CompassSchemaValidation';

  /**
   * Renders the CompassSchemaValidation component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={styles.root}>
        <ValidationStates {...this.props} />
      </div>
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
  serverVersion: state.serverVersion,
  validation: state.validation,
  fields: state.fields,
  namespace: state.namespace,
  sampleDocuments: state.sampleDocuments,
  isZeroState: state.isZeroState,
  isLoaded: state.isLoaded,
  editMode: state.editMode,
  isEditable:
    !state.editMode.collectionReadOnly &&
    !state.editMode.collectionTimeSeries &&
    !state.editMode.preferencesReadOnly &&
    !state.editMode.writeStateStoreReadOnly &&
    !state.editMode.oldServerReadOnly,
});

/**
 * Connect the redux store to the component (dispatch).
 */
const MappedCompassSchemaValidation = connect(mapStateToProps, {
  fetchSampleDocuments,
  validatorChanged,
  cancelValidation,
  saveValidation,
  namespaceChanged,
  validationActionChanged,
  validationLevelChanged,
  zeroStateChanged,
  changeZeroState,
})(CompassSchemaValidation);

export default MappedCompassSchemaValidation;
export { CompassSchemaValidation };
