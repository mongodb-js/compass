import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
} from '@mongodb-js/compass-components';

import {
  addField,
  removeField,
  updateFieldType,
  updateFieldName,
} from '../../modules/create-index/fields';
import { changeSchemaFields } from '../../modules/create-index/schema-fields';
import {
  createNewIndexField,
  clearNewIndexField,
} from '../../modules/create-index/new-index-field';
import { clearError, handleError } from '../../modules/error';
import { openLink } from '../../modules/link';
import { createIndex, closeCreateIndexModal } from '../../modules/create-index';
import { CreateIndexForm } from '../create-index-form/create-index-form';
import CreateIndexActions from '../create-index-actions';
import type { RootState } from '../../modules/create-index';

const { track } = createLoggerAndTelemetry('COMPASS-IMPORT-EXPORT-UI');

function CreateIndexModal({
  isVisible,
  namespace,
  error,
  clearError,
  inProgress,
  createIndex,
  closeCreateIndexModal,
  ...props
}: React.ComponentProps<typeof CreateIndexForm> & {
  isVisible: boolean;
  namespace: string;
  error: string | null;
  clearError: () => void;
  inProgress: boolean;
  createIndex: () => void;
  closeCreateIndexModal: () => void;
}) {
  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        closeCreateIndexModal();
      } else {
        track('Screen', { name: 'create_index_modal' });
      }
    },
    [closeCreateIndexModal]
  );

  return (
    <Modal
      setOpen={onSetOpen}
      open={isVisible}
      trackingId="create_index_modal"
      data-testid="create-index-modal"
    >
      <ModalHeader title="Create Index" subtitle={namespace} />

      <ModalBody>
        <CreateIndexForm {...props} />
      </ModalBody>

      <ModalFooter>
        <CreateIndexActions
          error={error}
          clearError={clearError}
          inProgress={inProgress}
          createIndex={createIndex}
          closeCreateIndexModal={closeCreateIndexModal}
        />
      </ModalFooter>
    </Modal>
  );
}

const mapState = ({
  fields,
  inProgress,
  schemaFields,
  error,
  isVisible,
  namespace,
  serverVersion,
  newIndexField,
}: RootState) => ({
  fields,
  inProgress,
  schemaFields,
  error,
  isVisible,
  namespace,
  serverVersion,
  newIndexField,
});

const mapDispatch = {
  changeSchemaFields,
  clearError,
  handleError,
  createNewIndexField,
  clearNewIndexField,
  openLink,
  createIndex,
  closeCreateIndexModal,
  addField,
  removeField,
  updateFieldName,
  updateFieldType,
};
export default connect(mapState, mapDispatch)(CreateIndexModal);
