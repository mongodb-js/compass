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
  gap: spacing[400],
});

const textStyles = css({
  fontWeight: 'bolder',
});

const buttonStyles = css({
  background: 'none',
  border: 'none',
  fontWeight: 600,
  color: palette.blue.base,
  textTransform: 'uppercase',
  padding: 0,
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
        Compass is ready to update to {newVersion}!
      </Body>
      <button
        className={cx(buttonStyles, darkmode && buttonDarkStyles)}
        onClick={onUpdateClicked}
        data-testid="auto-update-restart-button"
      >
        Restart
      </button>
    </div>
  );
};

// We are using the same toast id for all the update toasts so that when we have
// to show a new toast, the old one is be replaced and user only sees one.
const updateToastId = 'compass-update';

export function onAutoupdateExternally({
  currentVersion,
  newVersion,
  onDismiss,
}: {
  currentVersion: string;
  newVersion: string;
  onDismiss: () => void;
}) {
  openToast(updateToastId, {
    variant: 'note',
    title: `Compass ${newVersion} is available`,
    description: (
      <>
        <Body>
          You are currently using {currentVersion}. Update now for the latest
          Compass features.
        </Body>
        <Link
          data-testid="auto-update-download-link"
          as="a"
          target="_blank"
          href={'https://www.mongodb.com/try/download/compass'}
          onClick={() => {
            closeToast(updateToastId);
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
  openToast(updateToastId, {
    variant: 'progress',
    title: `Compass ${newVersion} is downloading`,
  });
}
export function onAutoupdateFailed() {
  openToast(updateToastId, {
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
  openToast(updateToastId, {
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
  openToast(updateToastId, {
    variant: 'success',
    title: `Compass ${newVersion} installed successfully`,
    description: (
      <Link
        data-testid="auto-update-release-notes-link"
        as="a"
        target="_blank"
        href={`https://github.com/mongodb-js/compass/releases/tag/v${newVersion}`}
        onClick={() => {
          closeToast(updateToastId);
        }}
      >
        Release Notes
      </Link>
    ),
  });
}
