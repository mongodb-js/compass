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
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

type CreateIndexModalProps = React.ComponentProps<typeof CreateIndexForm> & {
  isVisible: boolean;
  namespace: string;
  error: string | null;
  inProgress: boolean;
  onErrorBannerCloseClick: () => void;
  onCreateIndexClick: () => void;
  onCancelCreateIndexClick: () => void;
};

function CreateIndexModal({
  isVisible,
  namespace,
  error,
  inProgress,
  onErrorBannerCloseClick,
  onCreateIndexClick,
  onCancelCreateIndexClick,
  ...props
}: CreateIndexModalProps) {
  const connectionInfoRef = useConnectionInfoRef();
  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        onCancelCreateIndexClick();
      }
    },
    [onCancelCreateIndexClick]
  );

  useTrackOnChange(
    (track: TrackFunction) => {
      const connectionInfo = connectionInfoRef.current;
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
    [isVisible, connectionInfoRef],
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
          onErrorBannerCloseClick={onErrorBannerCloseClick}
          inProgress={inProgress}
          onCreateIndexClick={onCreateIndexClick}
          onCancelCreateIndexClick={onCancelCreateIndexClick}
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
  onErrorBannerCloseClick: errorCleared,
  onCreateIndexClick: createIndex,
  onCancelCreateIndexClick: createIndexClosed,
  onAddFieldClick: fieldAdded,
  onRemoveFieldClick: fieldRemoved,
  onSelectFieldNameClick: updateFieldName,
  onSelectFieldTypeClick: fieldTypeUpdated,
};

export default connect(mapState, mapDispatch)(CreateIndexModal);
