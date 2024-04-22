import React from 'react';
import {
  css,
  spacing,
  Body,
  palette,
  useDarkMode,
  cx,
} from '@mongodb-js/compass-components';
import { openToast } from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  div: {
    display: 'flex',
    flexDirection: 'column',
    margin: 'auto',
    padding: spacing[1],
  },
});

const textStyles = css({
  fontWeight: 'bolder',
});

const buttonStyles = css({
  background: 'none',
  border: 'none',
  fontWeight: 'bold',
  color: palette.blue.base,
  '&:hover': {
    cursor: 'pointer',
  },
});

const buttonDarkStyles = css({
  color: palette.blue.light1,
});

const RestartCompassToastContent = ({
  updatedVersion,
  onUpdateClicked,
}: {
  updatedVersion: string;
  onUpdateClicked: () => void;
}) => {
  const darkmode = useDarkMode();
  return (
    <div className={containerStyles}>
      <Body className={textStyles}>
        Compass update {updatedVersion} has finished downloading
      </Body>
      <button
        className={cx(buttonStyles, darkmode && buttonDarkStyles)}
        onClick={onUpdateClicked}
      >
        Restart
      </button>
    </div>
  );
};

export function onAutoupdateExternally({
  currentVersion,
  newVersion,
  onUpdate,
  onDismiss,
}: {
  currentVersion: string;
  newVersion: string;
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  openToast('update-externally', {
    variant: 'note',
    title: 'A new Compass version available to install',
    description: `You are currently using version ${currentVersion}. New version of Compass (${newVersion}) is available to install. `,
    onClose: onDismiss,
  });
}

export function onAutoupdateStarted() {
  openToast('update-download', {
    variant: 'progress',
    title: 'Compass update is in progress',
  });
}
export function onAutoupdateFailed() {
  openToast('update-download', {
    variant: 'warning',
    title: 'Failed to download Compass update',
    description: 'Downloading a newer Compass version failed',
  });
}
export function onAutoupdateSuccess({
  updatedVersion,
  onUpdate,
  onDismiss,
}: {
  updatedVersion: string;
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  openToast('update-download', {
    variant: 'note',
    title: '',
    description: (
      <RestartCompassToastContent
        updatedVersion={updatedVersion}
        onUpdateClicked={onUpdate}
      />
    ),
    onClose: onDismiss,
  });
}
