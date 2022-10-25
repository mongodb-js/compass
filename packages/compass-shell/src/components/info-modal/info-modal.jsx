import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import {
  css,
  Banner,
  Button,
  ModalTitle,
  Modal,
  Link,
  Subtitle,
  ModalFooter,
  spacing
} from '@mongodb-js/compass-components';

import { KeyboardShortcutsTable } from './keyboard-shortcuts-table';

const mongoshVersion = `v${
  require('@mongosh/browser-repl/package.json').version
}`;

const modalContentWrapperStyles = css({
  padding: 'initial'
});

const shortcutsTableContainerStyles = css({
  marginTop: spacing[2],
  maxHeight: '50vh',
  overflow: 'auto'
});

const shortcutsTitleStyles = css({
  marginTop: spacing[4]
});

const modalContentStyles = css({
  padding: spacing[5]
});

/**
 * Show information on how to use the shell in compass.
 */
function InfoModal({
  hideInfoModal,
  show
}) {
  const onSetOpen = useCallback((open) => {
    if (!open) {
      hideInfoModal();
    }
  }, [hideInfoModal]);

  return (
    <Modal
      open={show}
      trackingId="shell_info_modal"
      setOpen={onSetOpen}
      contentClassName={modalContentWrapperStyles}
      data-testid="shell-info-modal"
    >
      <div className={modalContentStyles}>
        <ModalTitle>mongosh {mongoshVersion}</ModalTitle>
        <Banner>
          For more information please visit the&nbsp;
          <Link
            id="mongosh-info-link"
            href="https://docs.mongodb.com/compass/beta/embedded-shell/"
            target="_blank"
          >MongoDB Shell Documentation</Link>.
        </Banner>
        <Subtitle
          className={shortcutsTitleStyles}
        >
          Keyboard Shortcuts
        </Subtitle>
        <div className={shortcutsTableContainerStyles}>
          <KeyboardShortcutsTable />
        </div>
      </div>
      <ModalFooter>
        <Button
          onClick={hideInfoModal}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

InfoModal.propTypes = {
  hideInfoModal: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired
};

export default InfoModal;
