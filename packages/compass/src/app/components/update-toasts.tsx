import React from 'react';
import {
  css,
  spacing,
  Body,
  palette,
  useDarkMode,
  cx,
  Link,
  openToast,
  closeToast,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[100],
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
  newVersion,
  onUpdateClicked,
}: {
  newVersion: string;
  onUpdateClicked: () => void;
}) => {
  const darkmode = useDarkMode();
  return (
    <div className={containerStyles}>
      <Body className={textStyles}>
        Compass update {newVersion} has finished downloading
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
  onDismiss,
}: {
  currentVersion: string;
  newVersion: string;
  onDismiss: () => void;
}) {
  const toastId = 'compass-update-externally';
  openToast(toastId, {
    variant: 'note',
    title: 'A new Compass version is available to install',
    description: (
      <>
        <Body>
          Compass {newVersion} is available. You are currently using{' '}
          {currentVersion}. Would you like to download it now?
        </Body>
        <Link
          as="a"
          target="_blank"
          href={'https://www.mongodb.com/try/download/compass'}
          onClick={() => {
            closeToast(toastId);
          }}
        >
          Visit download center
        </Link>
      </>
    ),
    onClose: onDismiss,
  });
}
export function onAutoupdateStarted({ newVersion }: { newVersion: string }) {
  openToast('compass-update-started', {
    variant: 'progress',
    title: `Compass ${newVersion} is downloading`,
  });
}
export function onAutoupdateFailed() {
  openToast('compass-update-failed', {
    variant: 'warning',
    title: 'Failed to download Compass update',
    description: 'Downloading a newer Compass version failed',
  });
}
export function onAutoupdateSuccess({
  newVersion,
  onUpdate,
  onDismiss,
}: {
  newVersion: string;
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  openToast('compass-update-succeeded', {
    variant: 'success',
    title: '',
    description: (
      <RestartCompassToastContent
        newVersion={newVersion}
        onUpdateClicked={onUpdate}
      />
    ),
    onClose: onDismiss,
  });
}
export function onAutoupdateInstalled({ newVersion }: { newVersion: string }) {
  const toastId = 'compass-update-restarted';
  openToast(toastId, {
    variant: 'success',
    title: `Compass ${newVersion} is installed successfully`,
    description: (
      <Link
        as="a"
        target="_blank"
        href={`https://github.com/mongodb-js/compass/releases/tag/v${newVersion}`}
        onClick={() => {
          closeToast(toastId);
        }}
      >
        Release Notes
      </Link>
    ),
  });
}
