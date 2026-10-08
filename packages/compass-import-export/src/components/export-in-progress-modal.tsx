import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Modal,
  ModalFooter,
  ModalHeader,
  useTranslation,
} from '@mongodb-js/compass-components';

import { closeInProgressMessage } from '../modules/export';
import type { RootExportState } from '../stores/export-store';

type InProgressModalProps = {
  closeInProgressMessage: () => void;
  isInProgressMessageOpen: boolean;
};

function ExportInProgressModal({
  closeInProgressMessage,
  isInProgressMessageOpen,
}: InProgressModalProps) {
  const t = useTranslation();
  return (
    <Modal
      open={isInProgressMessageOpen}
      setOpen={closeInProgressMessage}
      data-testid="export-in-progress-modal"
    >
      <ModalHeader
        title={t(
          'importExport.exportInProgress.title',
          'Sorry, currently only one export operation is possible at a time'
        )}
        subtitle={t(
          'importExport.exportInProgress.subtitle',
          'Export is disabled as there is an export already in progress.'
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

const mapStateToProps = (state: RootExportState) => ({
  isInProgressMessageOpen: state.export.isInProgressMessageOpen,
});
export default connect(mapStateToProps, {
  closeInProgressMessage,
})(ExportInProgressModal);
