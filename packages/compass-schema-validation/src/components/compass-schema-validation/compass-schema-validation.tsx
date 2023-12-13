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
import { changeZeroState } from '../../modules/zero-state';
import { withPreferences } from 'compass-preferences-model';
import { css } from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import type { ValidationStatesProps } from '../validation-states/validation-states';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

const containerStyles = css({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

const styles = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  height: '100%',
});

/**
 * The core schema validation component.
 */
class CompassSchemaValidation extends Component<
  Pick<CollectionTabPluginMetadata, 'isActive'> & ValidationStatesProps
> {
  static displayName = 'CompassSchemaValidation';

  /**
   * Renders the CompassSchemaValidation component.
   */
  render() {
    const { isActive, ...props } = this.props;

    if (!isActive) {
      return null;
    }

    return (
      <div className={containerStyles} data-testid="validation-content">
        <div className={styles} data-testid="compass-schema-validation">
          <ValidationStates {...props} />
        </div>
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
const mapStateToProps = (state: RootState) => ({
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
  changeZeroState,
})(withPreferences(CompassSchemaValidation, ['readOnly'], React));

export default MappedCompassSchemaValidation;
export { CompassSchemaValidation };
