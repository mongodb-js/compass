import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import {
  css,
  Banner,
  Button,
  H2,
  Modal,
  Link,
  Subtitle,
  Footer,
  spacing
} from '@mongodb-js/compass-components';

import { KeyboardShortcutsTable } from './keyboard-shortcuts-table';

import packageJson from '../../../package.json';

const mongoshVersion = `v${packageJson.dependencies['@mongosh/browser-repl'].replace('^', '')}`;

const modalContentWrapperStyles = css({
  padding: 'initial'
});

const bannerStyles = css({
  marginTop: spacing[4]
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
    >
      <div className={modalContentStyles}>
        <H2>mongosh {mongoshVersion}</H2>
        <Banner
          className={bannerStyles}
        >
          For more information please visit the&nbsp;
          <Link
            id="mongosh-info-link"
            rel="noreopener"
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
          <KeyboardShortcutsTable /></div>
      </div>
      <Footer>
        <Button
          onClick={hideInfoModal}
        >
          Close
        </Button>
      </Footer>
    </Modal>
  );
}

InfoModal.propTypes = {
  hideInfoModal: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired
};

export default InfoModal;
