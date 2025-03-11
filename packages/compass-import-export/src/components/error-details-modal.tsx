import React from 'react';
import { ErrorDetailsModal } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { RootImportState } from '../stores/import-store';
import { onErrorDetailsClose } from '../modules/import';

const ImportErrorDetailsModal: React.FunctionComponent<{
  isOpen: boolean;
  errorDetails?: Record<string, unknown>;
  onClose: () => void;
}> = ({ isOpen, errorDetails, onClose }) => {
  return (
    <ErrorDetailsModal
      closeAction="close"
      open={isOpen}
      details={errorDetails}
      onClose={onClose}
    />
  );
};

const ConnectedImportErrorDetailsModal = connect(
  (state: RootImportState) => ({
    isOpen: state.import.errorDetails.isOpen,
    errorDetails: state.import.errorDetails.details,
  }),
  {
    onClose: onErrorDetailsClose,
  }
)(ImportErrorDetailsModal);

export default ConnectedImportErrorDetailsModal;
