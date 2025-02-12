import React, { useCallback } from 'react';
import {
  css,
  Banner,
  InfoModal,
  Link,
  Subtitle,
  spacing,
} from '@mongodb-js/compass-components';

import { KeyboardShortcutsTable } from './keyboard-shortcuts-table';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';

const shortcutsTableContainerStyles = css({
  marginTop: spacing[2],
  maxHeight: '50vh',
  overflow: 'auto',
});

const shortcutsTitleStyles = css({
  marginTop: spacing[4],
});

function ShellInfoModal({
  hideInfoModal,
  show,
  mongoshVersion,
}: {
  hideInfoModal: () => void;
  show: boolean;
  mongoshVersion: string;
}) {
  useTrackOnChange(
    (track: TrackFunction) => {
      if (show) {
        track('Screen', { name: 'shell_info_modal' }, undefined);
      }
    },
    [show],
    undefined
  );

  const onClose = useCallback(() => {
    hideInfoModal();
  }, [hideInfoModal]);

  return (
    <InfoModal
      open={show}
      title={`mongosh ${mongoshVersion}`}
      data-testid="shell-info-modal"
      onClose={onClose}
    >
      <Banner>
        For more information please visit the&nbsp;
        <Link
          id="mongosh-info-link"
          href="https://docs.mongodb.com/compass/beta/embedded-shell/"
          target="_blank"
        >
          MongoDB Shell Documentation
        </Link>
        .
      </Banner>
      <Subtitle className={shortcutsTitleStyles}>Keyboard Shortcuts</Subtitle>
      <div className={shortcutsTableContainerStyles}>
        <KeyboardShortcutsTable />
      </div>
    </InfoModal>
  );
}

export default ShellInfoModal;
