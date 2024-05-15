import React, { type FunctionComponent, useCallback, useState } from 'react';
import { connect } from 'react-redux';
import ValidationStates from '../validation-states';
import {
  validatorChanged,
  cancelValidation,
  saveValidation,
  validationActionChanged,
  validationLevelChanged,
  generateValidator,
} from '../../modules/validation';
import { namespaceChanged } from '../../modules/namespace';
import { clearSampleDocuments } from '../../modules/sample-documents';
import { changeZeroState } from '../../modules/zero-state';
import { withPreferences } from 'compass-preferences-model/provider';
import { css } from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import type { ValidationStatesProps } from '../validation-states/validation-states';
import SchemaProposalModal from '../schema-proposal-modal/schema-proposal-modal';

const styles = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  height: '100%',
});

/**
 * The core schema validation component.
 */
const CompassSchemaValidation: FunctionComponent<
  Omit<ValidationStatesProps, 'openSchemaProposalModal'> & {
    generateValidator: () => void;
  }
> = ({ generateValidator, ...props }) => {
  const [isSchemaProposalModalOpen, setIsSchemaProposalModalOpen] =
    useState(false);

  const openModal = useCallback(
    () => setIsSchemaProposalModalOpen(true),
    [setIsSchemaProposalModalOpen]
  );
  const closeModal = useCallback(
    () => setIsSchemaProposalModalOpen(false),
    [setIsSchemaProposalModalOpen]
  );

  return (
    <div className={styles} data-testid="compass-schema-validation">
      <ValidationStates {...props} openSchemaProposalModal={openModal} />
      <SchemaProposalModal
        generateValidator={generateValidator}
        isVisible={isSchemaProposalModalOpen}
        close={closeModal}
      />
    </div>
  );
};

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
  namespace: state.namespace.ns,
  isZeroState: state.isZeroState,
  isLoaded: state.isLoaded,
  editMode: state.editMode,
});

/**
 * Connect the redux store to the component (dispatch).
 */
const MappedCompassSchemaValidation: React.FunctionComponent<unknown> = connect(
  mapStateToProps,
  {
    clearSampleDocuments,
    validatorChanged,
    cancelValidation,
    saveValidation,
    namespaceChanged,
    validationActionChanged,
    validationLevelChanged,
    changeZeroState,
    generateValidator,
  }
)(withPreferences(CompassSchemaValidation, ['readOnly']));

export default MappedCompassSchemaValidation;
export { CompassSchemaValidation };
