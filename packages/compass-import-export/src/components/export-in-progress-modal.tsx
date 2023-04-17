import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Modal,
  ModalFooter,
  ModalHeader,
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
  return (
    <Modal
      open={isInProgressMessageOpen}
      setOpen={closeInProgressMessage}
      data-testid="export-in-progress-modal"
    >
      <ModalHeader
        title="Sorry, currently only one export operation is possible at a time"
        subtitle="Export is disabled as there is an export already in progress."
      />
      <ModalFooter>
        <Button onClick={closeInProgressMessage}>Cancel</Button>
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
