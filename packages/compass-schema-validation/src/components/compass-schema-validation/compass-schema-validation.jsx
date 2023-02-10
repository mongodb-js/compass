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
import { clearSampleDocuments } from '../../modules/sample-documents';
import { changeZeroState, zeroStateChanged } from '../../modules/zero-state';
import { withPreferences } from 'compass-preferences-model';

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
  isZeroState: state.isZeroState,
  isLoaded: state.isLoaded,
  editMode: state.editMode,
});

/**
 * Connect the redux store to the component (dispatch).
 */
const MappedCompassSchemaValidation = connect(mapStateToProps, {
  clearSampleDocuments,
  validatorChanged,
  cancelValidation,
  saveValidation,
  namespaceChanged,
  validationActionChanged,
  validationLevelChanged,
  zeroStateChanged,
  changeZeroState,
})(withPreferences(CompassSchemaValidation, ['readOnly'], React));

export default MappedCompassSchemaValidation;
export { CompassSchemaValidation };
