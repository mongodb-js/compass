import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  FormModal,
  SpinLoader,
  css,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import { createView, changeViewName, close } from '../../modules/create-view';
import type { CreateViewRootState } from '../../stores/create-view';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { useConnectionsListRef } from '@mongodb-js/compass-connections/provider';

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

type CreateViewModalProps = {
  createView: () => void;
  isVisible?: boolean;
  closeModal: () => void;
  name?: string;
  changeViewName: (name: string) => void;
  isDuplicating?: boolean;
  connectionId: ConnectionInfo['id'];
  isRunning?: boolean;
  error: string | null;
};

const CreateViewModal: React.FunctionComponent<CreateViewModalProps> = ({
  createView,
  isVisible,
  closeModal,
  name,
  changeViewName,
  isDuplicating,
  connectionId,
  isRunning,
  error,
}) => {
  const track = useTelemetry();
  const { getConnectionById } = useConnectionsListRef();

  useEffect(() => {
    if (isVisible && connectionId) {
      track(
        'Screen',
        { name: 'create_view_modal' },
        getConnectionById(connectionId)?.info
      );
    }
  }, [isVisible, connectionId, getConnectionById, track]);

  return (
    <FormModal
      title={isDuplicating ? 'Duplicate View' : 'Create a View'}
      open={isVisible}
      onSubmit={createView}
      onCancel={closeModal}
      submitButtonText="Create"
      data-testid="create-view-modal"
    >
      <TextInput
        data-testid="create-view-name"
        value={name || ''}
        onChange={(evt) => {
          changeViewName(evt.currentTarget.value);
        }}
        label="Name"
        name="name"
      />
      {error ? <Banner variant="danger">{error}</Banner> : null}
      {isRunning ? (
        <Body className={progressContainerStyles}>
          <SpinLoader />
          <span>Creating view&hellip;</span>
        </Body>
      ) : null}
    </FormModal>
  );
};

const mapStateToProps = (state: CreateViewRootState) => ({
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  isDuplicating: state.isDuplicating,
  name: state.name,
  error: state.error?.message ?? null,
  source: state.source,
  pipeline: state.pipeline,
  connectionId: state.connectionId,
});

const MappedCreateViewModal = connect(mapStateToProps, {
  createView,
  changeViewName,
  closeModal: close,
})(CreateViewModal);

export default MappedCreateViewModal;
export { CreateViewModal };
