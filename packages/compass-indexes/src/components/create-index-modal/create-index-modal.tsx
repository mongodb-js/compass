import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
} from '@mongodb-js/compass-components';
import {
  fieldAdded,
  fieldRemoved,
  fieldTypeUpdated,
  updateFieldName,
  errorCleared,
  createIndex,
  createIndexClosed,
} from '../../modules/create-index';
import { CreateIndexForm } from '../create-index-form/create-index-form';
import CreateIndexActions from '../create-index-actions';
import type { RootState } from '../../modules';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

type CreateIndexModalProps = React.ComponentProps<typeof CreateIndexForm> & {
  isVisible: boolean;
  namespace: string;
  error: string | null;
  errorCleared: () => void;
  inProgress: boolean;
  createIndex: () => void;
  createIndexClosed: () => void;
};

function CreateIndexModal({
  isVisible,
  namespace,
  error,
  errorCleared,
  inProgress,
  createIndex,
  createIndexClosed,
  ...props
}: CreateIndexModalProps) {
  const connectionInfoAccess = useConnectionInfoAccess();
  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        createIndexClosed();
      }
    },
    [createIndexClosed]
  );

  useTrackOnChange(
    (track: TrackFunction) => {
      const connectionInfo = connectionInfoAccess.getCurrentConnectionInfo();
      if (isVisible) {
        track('Screen', { name: 'create_index_modal' }, connectionInfo);
        track(
          'Index Create Opened',
          {
            atlas_search: false,
          },
          connectionInfo
        );
      }
    },
    [isVisible, connectionInfoAccess],
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
        <CreateIndexForm namespace={namespace} {...props} />
      </ModalBody>

      <ModalFooter>
        <CreateIndexActions
          error={error}
          errorCleared={errorCleared}
          inProgress={inProgress}
          createIndex={createIndex}
          createIndexClosed={createIndexClosed}
        />
      </ModalFooter>
    </Modal>
  );
}

const mapState = ({ namespace, serverVersion, createIndex }: RootState) => {
  const { fields, inProgress, error, isVisible } = createIndex;
  return {
    fields,
    inProgress,
    error,
    isVisible,
    namespace,
    serverVersion,
  };
};

const mapDispatch = {
  errorCleared,
  createIndex,
  createIndexClosed,
  fieldAdded,
  fieldRemoved,
  updateFieldName,
  fieldTypeUpdated,
};

export default connect(mapState, mapDispatch)(CreateIndexModal);
