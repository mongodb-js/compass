import React, { useCallback, useMemo } from 'react';
import {
  Badge,
  Banner,
  css,
  FormFieldContainer,
  FormModal,
  spacing,
  useToast,
} from '@mongodb-js/compass-components';
import { FileInput } from './file-input';
import { Passphrase } from './passphrase';
import { SelectTable } from './select-table';
import type { ImportExportResult } from '../hooks/common';
import { useOpenModalThroughIpc } from '../hooks/common';
import { useImportConnections } from '../hooks/use-import';
import type {
  ConnectionInfo,
  ConnectionStorage,
} from '@mongodb-js/connection-storage/renderer';

const TOAST_TIMEOUT_MS = 5000;

const tableStyles = css({
  maxHeight: '24vh',
  overflow: 'auto',
});

const existingFavoriteBadgeStyles = css({
  marginLeft: spacing[2],
});

const selectTableColumns = [['displayName', 'Connection Name']] as const;

export function ImportConnectionsModal({
  open,
  setOpen,
  favoriteConnections,
  afterImport,
  trackingProps,
  connectionStorage,
}: {
  open: boolean;
  setOpen: (newOpen: boolean) => void;
  favoriteConnections: Pick<ConnectionInfo, 'favorite' | 'id'>[];
  afterImport?: () => void;
  trackingProps?: Record<string, unknown>;
  connectionStorage?: typeof ConnectionStorage;
}): React.ReactElement {
  const { openToast } = useToast('compass-connection-import-export');
  const finish = useCallback(
    (result: ImportExportResult) => {
      setOpen(false);
      if (result === 'succeeded') {
        openToast('import-succeeded', {
          title: 'Import successful',
          description: 'New connections have been added',
          variant: 'success',
          timeout: TOAST_TIMEOUT_MS,
        });
        afterImport?.();
      }
    },
    [afterImport, openToast, setOpen]
  );

  useOpenModalThroughIpc(open, setOpen, 'compass:open-import-connections');

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
  } = useImportConnections(
    {
      finish,
      open,
      favoriteConnections,
      trackingProps,
    },
    connectionStorage?.importConnections.bind(connectionStorage),
    connectionStorage?.deserializeConnections.bind(connectionStorage)
  );

  const [displayConnectionList, hasSelectedDuplicates] = useMemo(() => {
    return [
      connectionList.map((conn) => ({
        ...conn,
        displayName: (
          <>
            {conn.name}
            {conn.isExistingFavorite && (
              <Badge
                className={existingFavoriteBadgeStyles}
                variant={conn.selected ? 'yellow' : 'lightgray'}
                data-testid={`existing-favorite-badge-${conn.id}`}
              >
                Existing Favorite
              </Badge>
            )}
          </>
        ),
      })),
      connectionList.some((conn) => conn.isExistingFavorite && conn.selected),
    ];
  }, [connectionList]);

  return (
    <FormModal
      open={open}
      onCancel={onCancel}
      onSubmit={onSubmit}
      title="Import saved connections"
      submitButtonText="Import"
      submitDisabled={inProgress || !!error || !filename}
      data-testid="connection-import-modal"
    >
      <FormFieldContainer>
        <FileInput
          label="Source File"
          mode="open"
          disabled={inProgress}
          onChange={onChangeFilename}
          value={filename}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Passphrase
          label="Decryption Password"
          description="Passphrase to decrypt secrets if one has been specified while exporting"
          required={passphraseRequired}
          accepted={connectionList.length > 0}
          disabled={inProgress}
          onChange={onChangePassphrase}
          value={passphrase}
        />
      </FormFieldContainer>
      {connectionList.length > 0 && (
        <SelectTable
          className={tableStyles}
          items={displayConnectionList}
          columns={selectTableColumns}
          disabled={inProgress}
          onChange={onChangeConnectionList}
        />
      )}
      {(error && !passphraseRequired && (
        <Banner variant="danger">Error: {error}</Banner>
      )) ||
        (hasSelectedDuplicates && (
          <Banner variant="warning">
            Some connections are already saved and will be overwritten by
            importing them
          </Banner>
        ))}
    </FormModal>
  );
}
