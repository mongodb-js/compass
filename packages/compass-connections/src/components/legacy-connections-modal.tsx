import React, { useEffect, useState, useCallback } from 'react';
import {
  spacing,
  css,
  Link,
  Button,
  usePersistedState,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Body,
  Banner,
} from '@mongodb-js/compass-components';

import type { ConnectionStorage } from '@mongodb-js/connection-storage/renderer';

const LEGACY_MODAL_STORAGE_KEY = 'hide_legacy_connections_modal';

const listStyle = css({
  listStyle: 'decimal',
  paddingLeft: spacing[5],
  li: {
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },
});

const bodyStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
});

const bannerContentStyles = css({
  maxHeight: spacing[6] * 2,
  overflowY: 'scroll',
});

const footerStyles = css({
  flexDirection: 'row',
  justifyContent: 'space-between',
});

const useLegacyModel = (connectionStorage: typeof ConnectionStorage) => {
  const [connections, setConnections] = useState<{ name: string }[]>([]);

  const [isModalHiddenByUser, setIsModalHiddenByUser] = usePersistedState(
    LEGACY_MODAL_STORAGE_KEY,
    false
  );

  useEffect(() => {
    void connectionStorage
      .getLegacyConnections()
      .then((connections) => setConnections(connections));
  }, []);

  return {
    isOpen: connections.length > 0 && !isModalHiddenByUser,
    connections,
    hideModal: () => setConnections([]),
    hideModalPermanently: () => {
      setIsModalHiddenByUser(true);
      setConnections([]);
    },
  };
};

export const LegacyConnectionsModal = ({
  connectionStorage,
}: {
  connectionStorage: typeof ConnectionStorage;
}) => {
  const [isHideModalChecked, setIsHideModalChecked] = useState(false);
  const { hideModal, hideModalPermanently, isOpen, connections } =
    useLegacyModel(connectionStorage);

  const onCloseModal = useCallback(() => {
    if (isHideModalChecked) {
      hideModalPermanently();
    } else {
      hideModal();
    }
  }, [isHideModalChecked, hideModalPermanently, hideModal]);

  return (
    <Modal
      data-testid="legacy-connections-modal"
      open={isOpen}
      setOpen={() => hideModal()}
    >
      <ModalHeader title="Legacy connections detected" />
      <ModalBody className={bodyStyles}>
        <Body>
          Compass has identified legacy connections that are no longer supported
          beyond v1.39.0.
        </Body>
        <Banner>
          <div className={bannerContentStyles}>
            <ul>
              {connections.map(({ name }, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>
        </Banner>
        <strong>To migrate these connections:</strong>
        <ol className={listStyle}>
          <li>
            <Body>
              Install{' '}
              <Link
                target="_blank"
                hideExternalIcon
                href="https://github.com/mongodb-js/compass/releases/tag/v1.39.0"
              >
                Compass v1.39.0
              </Link>{' '}
              and{' '}
              <Link
                target="_blank"
                hideExternalIcon
                href="https://www.mongodb.com/docs/compass/current/connect/favorite-connections/import-export-ui/export/"
              >
                export your saved connections.
              </Link>
            </Body>
          </li>
          <li>
            <Body>
              Update Compass to the latest version and{' '}
              <Link
                target="_blank"
                hideExternalIcon
                href="https://www.mongodb.com/docs/compass/current/connect/favorite-connections/import-export-ui/import/"
              >
                import your saved connections
              </Link>{' '}
              from the previous step.
            </Body>
          </li>
        </ol>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Checkbox
          checked={isHideModalChecked}
          onChange={(event) => setIsHideModalChecked(event.target.checked)}
          label="Don't show this again"
        />
        <Button variant="default" onClick={onCloseModal}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
