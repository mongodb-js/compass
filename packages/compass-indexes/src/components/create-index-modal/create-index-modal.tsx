import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { useTrackOnChange } from '@mongodb-js/compass-logging/provider';
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
import { clearError } from '../../modules/create-index/error';
import { createIndex, closeCreateIndexModal } from '../../modules/create-index';
import { CreateIndexForm } from '../create-index-form/create-index-form';
import CreateIndexActions from '../create-index-actions';
import type { RootState } from '../../modules/create-index';

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
      }
    },
    [closeCreateIndexModal]
  );

  useTrackOnChange(
    'COMPASS-INDEXES-UI',
    (track) => {
      if (isVisible) {
        track('Screen', { name: 'create_index_modal' });
        track('Index Create Opened', {
          atlas_search: false,
        });
      }
    },
    [isVisible],
    undefined
  );

  return (
    <Modal
      open={isVisible}
      setOpen={onSetOpen}
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
}: RootState) => ({
  fields,
  inProgress,
  schemaFields,
  error,
  isVisible,
  namespace,
  serverVersion,
});

const mapDispatch = {
  changeSchemaFields,
  clearError,
  createIndex,
  closeCreateIndexModal,
  addField,
  removeField,
  updateFieldName,
  updateFieldType,
};
export default connect(mapState, mapDispatch)(CreateIndexModal);
