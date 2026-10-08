import React, { useCallback, useMemo } from 'react';
import {
  Badge,
  Banner,
  css,
  FormFieldContainer,
  FormModal,
  spacing,
  openToast,
  SelectList,
  useTranslation,
} from '@mongodb-js/compass-components';
import { FileInput } from './file-input';
import { Passphrase } from './passphrase';
import type { ImportExportResult } from '../hooks/common';
import { useOpenModalThroughIpc } from '../hooks/common';
import { useImportConnections } from '../hooks/use-import-connections';

const TOAST_TIMEOUT_MS = 5000;

const tableStyles = css({
  maxHeight: '24vh',
  overflow: 'auto',
});

const existingFavoriteBadgeStyles = css({
  marginLeft: spacing[200],
});

export function ImportConnectionsModal({
  open,
  setOpen,
  trackingProps,
}: {
  open: boolean;
  setOpen: (newOpen: boolean, trackingProps?: Record<string, unknown>) => void;
  trackingProps?: Record<string, unknown>;
}): React.ReactElement {
  const t = useTranslation();
  const selectListLabel = useMemo(
    () =>
      ({
        displayLabelKey: 'displayName',
        ariaLabelKey: 'name',
        name: t('connections.importExport.connectionName', 'Connection Name'),
      }) as const,
    [t]
  );
  const finish = useCallback(
    (result: ImportExportResult) => {
      setOpen(false);
      if (result === 'succeeded') {
        openToast('compass-connection-import-export--import-succeeded', {
          title: t('connections.import.successTitle', 'Import successful'),
          description: t(
            'connections.import.successDescription',
            'New connections have been added'
          ),
          variant: 'success',
          timeout: TOAST_TIMEOUT_MS,
        });
      }
    },
    [setOpen, t]
  );

  const openModalThroughIpc = useCallback(() => {
    setOpen(true, { context: 'menuBar' });
  }, [setOpen]);

  useOpenModalThroughIpc(
    open,
    openModalThroughIpc,
    'compass:open-import-connections'
  );

  const {
    onSubmit,
    onCancel,
    onChangeFilename,
    onChangePassphrase,
    onChangeConnectionList,
    state: {
      inProgress,
      error,
      passphraseRequired,
      connectionList,
      filename,
      passphrase,
    },
  } = useImportConnections({
    finish,
    open,
    trackingProps,
  });

  const [displayConnectionList, hasSelectedDuplicates] = useMemo(() => {
    return [
      connectionList.map((conn) => ({
        ...conn,
        displayName: (
          <>
            {conn.name}
            {conn.isExistingConnection && (
              <Badge
                className={existingFavoriteBadgeStyles}
                variant={conn.selected ? 'yellow' : 'lightgray'}
                data-testid={`existing-favorite-badge-${conn.id}`}
              >
                {t(
                  'connections.import.existingConnection',
                  'Existing Connection'
                )}
              </Badge>
            )}
          </>
        ),
      })),
      connectionList.some((conn) => conn.isExistingConnection && conn.selected),
    ];
  }, [connectionList, t]);

  return (
    <FormModal
      open={open}
      onCancel={onCancel}
      onSubmit={onSubmit}
      title={t('connections.import.title', 'Import saved connections')}
      submitButtonText={t('connections.import.submit', 'Import')}
      submitDisabled={inProgress || !!error || !filename}
      data-testid="connection-import-modal"
    >
      <FormFieldContainer>
        <FileInput
          label={t('connections.import.sourceFile', 'Source File')}
          mode="open"
          disabled={inProgress}
          onChange={onChangeFilename}
          value={filename}
        />
        <Banner variant="warning">
          {t(
            'connections.import.untrustedWarning',
            'Only import connection files from trusted sources. Imported files may contain sensitive connection details and network configurations.'
          )}
        </Banner>
      </FormFieldContainer>
      <FormFieldContainer>
        <Passphrase
          label={t(
            'connections.import.decryptionPassword',
            'Decryption Password'
          )}
          description={t(
            'connections.import.decryptionPasswordDescription',
            'Passphrase to decrypt secrets if one has been specified while exporting'
          )}
          required={passphraseRequired}
          accepted={connectionList.length > 0}
          disabled={inProgress}
          onChange={onChangePassphrase}
          value={passphrase}
        />
      </FormFieldContainer>
      {connectionList.length > 0 && (
        <SelectList
          className={tableStyles}
          items={displayConnectionList}
          label={selectListLabel}
          disabled={inProgress}
          onChange={onChangeConnectionList}
        />
      )}
      {(error && !passphraseRequired && (
        <Banner variant="danger">
          {t('connections.importExport.error', 'Error: {error}', { error })}
        </Banner>
      )) ||
        (hasSelectedDuplicates && (
          <Banner variant="warning">
            {t(
              'connections.import.overwriteWarning',
              'Some selected connections already exist and will be overwritten during import.'
            )}
          </Banner>
        ))}
    </FormModal>
  );
}
