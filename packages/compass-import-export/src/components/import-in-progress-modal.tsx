import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Modal,
  ModalFooter,
  ModalHeader,
  useTranslation,
} from '@mongodb-js/compass-components';

import { closeInProgressMessage } from '../modules/import';
import type { RootImportState } from '../stores/import-store';

type ImportInProgressModalProps = {
  closeInProgressMessage: () => void;
  isInProgressMessageOpen: boolean;
};

function ImportInProgressModal({
  closeInProgressMessage,
  isInProgressMessageOpen,
}: ImportInProgressModalProps) {
  const t = useTranslation();
  return (
    <Modal
      open={isInProgressMessageOpen}
      setOpen={closeInProgressMessage}
      data-testid="import-modal"
    >
      <ModalHeader
        title={t(
          'importExport.importInProgress.title',
          'Sorry, currently only one import operation is possible at a time'
        )}
        subtitle={t(
          'importExport.importInProgress.subtitle',
          'Import is disabled as there is an import already in progress.'
        )}
      />
      <ModalFooter>
        <Button onClick={closeInProgressMessage}>
          {t('importExport.inProgress.cancel', 'Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

const mapStateToProps = (state: RootImportState) => ({
  isInProgressMessageOpen: state.import.isInProgressMessageOpen,
});
export default connect(mapStateToProps, {
  closeInProgressMessage,
})(ImportInProgressModal);
