import React from 'react';
import {
  ConnectionSelectModal,
  type ConnectionSelectModalProps,
} from '@mongodb-js/compass-connections/provider';
import {
  type MapDispatchToProps,
  type MapStateToProps,
  connect,
} from 'react-redux';
import { type RootState } from '../stores';
import {
  closeModal,
  connectionSelectedForPreSelectedNamespace,
  openSelectedItem,
} from '../stores/open-item';

const mapState: MapStateToProps<
  Pick<
    ConnectionSelectModalProps,
    | 'descriptionText'
    | 'isModalOpen'
    | 'isSubmitDisabled'
    | 'submitButtonText'
    | 'connections'
    | 'selectedConnectionId'
  >,
  Record<string, never>,
  RootState
> = ({
  openItem: {
    openedModal,
    selectedConnection,
    selectedItem: item,
    connections,
  },
}) => {
  const namespace = `${item?.database ?? ''}.${item?.collection ?? ''}`;
  const itemType = item?.type ?? '';
  const itemName = item?.name ?? '';
  return {
    descriptionText: (
      <>
        The namespace <strong>{namespace}</strong> for the saved {itemType}{' '}
        <strong>{itemName}</strong>
        <br />
        exists in multiple active connections. Please select which connection
        you&rsquo;d like to
        <br />
        run the {itemType} against.
      </>
    ),
    isModalOpen: openedModal === 'select-connection-modal',
    isSubmitDisabled: !selectedConnection,
    submitButtonText: 'Run Query',
    connections,
    selectedConnectionId: selectedConnection ?? '',
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<
    ConnectionSelectModalProps,
    'onSubmit' | 'onClose' | 'onConnectionSelected'
  >,
  Record<string, never>
> = {
  onSubmit: openSelectedItem,
  onClose: closeModal,
  onConnectionSelected: connectionSelectedForPreSelectedNamespace,
};

export default connect(mapState, mapDispatch)(ConnectionSelectModal);
