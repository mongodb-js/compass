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

const ToastContentWithExternalLink = ({
  content,
  link,
  linkText,
}: {
  content: string;
  link: string;
  linkText: string;
}) => {
  const darkmode = useDarkMode();
  return (
    <div className={containerStyles}>
      <Body className={textStyles}>{content}</Body>
      <Link
        as="a"
        target="_blank"
        className={cx(linkStyles, darkmode && linkDarkStyles)}
        href={link}
      >
        {linkText}
      </Link>
    </div>
  );
};

export function onAutoupdateExternally({
  currentVersion,
  newVersion,
}: {
  currentVersion: string;
  newVersion: string;
}) {
  const content = `You are currently using version ${currentVersion}. New version of Compass (${newVersion}) is available to install.`;
  const link = `https://github.com/mongodb-js/compass/releases/tag/v${newVersion}`;
  openToast('update-externally', {
    variant: 'note',
    title: 'A new Compass version available to install',
    description: (
      <ToastContentWithExternalLink
        content={content}
        link={link}
        linkText={'Visit download center'}
      />
    ),
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
  const content = `Compass ${newVersion} is installed successfully`;
  const link = `https://github.com/mongodb-js/compass/releases/tag/v${newVersion}`;
  openToast('compass-update-restarted', {
    variant: 'note',
    title: '',
    description: (
      <ToastContentWithExternalLink
        content={content}
        linkText={'Release Notes'}
        link={link}
      />
    ),
  });
}
