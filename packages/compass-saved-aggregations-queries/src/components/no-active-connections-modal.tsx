import React from 'react';
import {
  type MapDispatchToProps,
  type MapStateToProps,
  connect,
} from 'react-redux';
import { type RootState } from '../stores';
import { closeModal } from '../stores/open-item';
import { Banner, InfoModal } from '@mongodb-js/compass-components';

type NoActiveConnectionsModalProps = {
  isOpened: boolean;
  onClose(): void;
};

const NoActiveConnectionsModal: React.FunctionComponent<
  NoActiveConnectionsModalProps
> = ({ isOpened, onClose }) => {
  return (
    <InfoModal
      title="Connect to a cluster"
      open={isOpened}
      onClose={onClose}
      showCloseButton={false}
      data-testid="no-active-connection-modal"
    >
      <Banner variant="warning">
        It appears that you are not connected to a cluster. Establish a
        connection first.
      </Banner>
    </InfoModal>
  );
};

const mapState: MapStateToProps<
  Pick<NoActiveConnectionsModalProps, 'isOpened'>,
  Record<string, never>,
  RootState
> = ({ openItem: { openedModal } }) => {
  return {
    isOpened: openedModal === 'no-active-connections-modal',
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<NoActiveConnectionsModalProps, 'onClose'>,
  Record<string, never>
> = {
  onClose: closeModal,
};

export default connect(mapState, mapDispatch)(NoActiveConnectionsModal);
