import React, { Component } from 'react';
import { connect } from 'react-redux';
import { pick } from 'lodash';
import ValidationStates from '../validation-states';
import {
  validatorChanged,
  cancelValidation,
  saveValidation,
  validationActionChanged,
  validationLevelChanged
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
const mapStateToProps = (state) => pick(
  state,
  [
    'serverVersion',
    'validation',
    'fields',
    'namespace',
    'sampleDocuments',
    'isZeroState',
    'isLoaded',
    'editMode'
  ]
);

/**
 * Connect the redux store to the component (dispatch).
 */
const MappedCompassSchemaValidation = connect(
  mapStateToProps,
  {
    fetchSampleDocuments,
    validatorChanged,
    cancelValidation,
    saveValidation,
    namespaceChanged,
    validationActionChanged,
    validationLevelChanged,
    zeroStateChanged,
    changeZeroState
  },
)(CompassSchemaValidation);

export default MappedCompassSchemaValidation;
export { CompassSchemaValidation };
