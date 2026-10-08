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
import { t } from '../utils/translate';

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
        {t(
          'app.update.readyToUpdate',
          'Compass is ready to update to {version}!',
          {
            version: newVersion,
          }
        )}
      </Body>
      <button
        className={cx(buttonStyles, darkmode && buttonDarkStyles)}
        onClick={onUpdateClicked}
        data-testid="auto-update-restart-button"
      >
        {t('app.update.restart', 'Restart')}
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
    title: t('app.update.available', 'Compass {version} is available', {
      version: newVersion,
    }),
    description: (
      <>
        <Body>
          {t(
            'app.update.currentlyUsing',
            'You are currently using {version}. Update now for the latest Compass features.',
            { version: currentVersion }
          )}
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
          {t('app.update.visitDownloadCenter', 'Visit download center')}
        </Link>
      </>
    ),
    onClose: onDismiss,
  });
}
export function onAutoupdateStarted({ newVersion }: { newVersion: string }) {
  openToast(updateToastId, {
    variant: 'progress',
    title: t('app.update.downloading', 'Compass {version} is downloading', {
      version: newVersion,
    }),
  });
}
export function onAutoupdateFailed(reason?: 'outdated-operating-system') {
  openToast(updateToastId, {
    variant: 'warning',
    title: t('app.update.downloadFailed', 'Failed to download Compass update'),
    description:
      reason === 'outdated-operating-system' ? (
        <>
          <Body>
            {t(
              'app.update.osUnsupported',
              'The version of your operating system is no longer supported.'
            )}
          </Body>
          <Link
            data-testid="system-requirements-link"
            as="a"
            target="_blank"
            href="https://www.mongodb.com/docs/compass/current/install/"
          >
            {t(
              'app.update.systemRequirements',
              'See Documentation on System Requirements'
            )}
          </Link>
        </>
      ) : (
        t(
          'app.update.downloadNewerFailed',
          'Downloading a newer Compass version failed'
        )
      ),
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
    title: t(
      'app.update.installed',
      'Compass {version} installed successfully',
      { version: newVersion }
    ),
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
        {t('app.update.releaseNotes', 'Release Notes')}
      </Link>
    ),
  });
}
