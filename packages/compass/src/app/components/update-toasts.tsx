import React from 'react';
import {
  css,
  spacing,
  Body,
  palette,
  useDarkMode,
  cx,
  Link,
} from '@mongodb-js/compass-components';
import { openToast } from '@mongodb-js/compass-components';

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

const linkStyles = css({
  whiteSpace: 'nowrap',
  textDecoration: 'none !important',
  span: {
    color: palette.blue.base,
  },
  svg: {
    color: palette.blue.base,
  },
});

const linkDarkStyles = css({
  span: {
    color: palette.blue.light1,
  },
  svg: {
    color: palette.blue.light1,
  },
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

const UpdateInstalledToastContent = ({
  newVersion,
}: {
  newVersion: string;
}) => {
  const darkmode = useDarkMode();
  return (
    <div className={containerStyles}>
      <Body className={textStyles}>
        Compass {newVersion} is installed successfully
      </Body>
      <Link
        as="a"
        className={cx(linkStyles, darkmode && linkDarkStyles)}
        href={`https://github.com/mongodb-js/compass/releases/tag/v${newVersion}`}
      >
        Release notes
      </Link>
    </div>
  );
};

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
  openToast('compass-update-restarted', {
    variant: 'note',
    title: '',
    description: <UpdateInstalledToastContent newVersion={newVersion} />,
  });
}
