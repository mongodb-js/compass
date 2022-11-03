import React, { useCallback } from 'react';
import {
  Banner,
  css,
  FormFieldContainer,
  FormModal,
  ToastVariant,
  useToast,
} from '@mongodb-js/compass-components';
import { FileInput } from './file-input';
import { Passphrase } from './passphrase';
import { SelectTable } from './select-table';
import type { ImportExportResult } from '../hooks/common';
import { useImportConnections } from '../hooks/use-import';

const TOAST_TIMEOUT_MS = 5000;

const tableStyles = css({
  maxHeight: '30vh',
  overflow: 'auto',
});

export function ImportConnectionsModal({
  open,
  setOpen,
  afterImport,
  trackingProps,
}: {
  open: boolean;
  setOpen: (newOpen: boolean) => void;
  afterImport?: () => void;
  trackingProps?: Record<string, unknown>;
}): React.ReactElement {
  const { openToast } = useToast('compass-connection-import-export');
  const finish = useCallback(
    (result: ImportExportResult) => {
      setOpen(false);
      if (result === 'succeeded') {
        openToast('import-succeeded', {
          title: 'Import successful',
          body: 'New connections have been added',
          variant: ToastVariant.Success,
          timeout: TOAST_TIMEOUT_MS,
        });
        afterImport?.();
      }
    },
    [afterImport, openToast, setOpen]
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
  } = useImportConnections({ finish, open, trackingProps });

  return (
    <FormModal
      open={open}
      onCancel={onCancel}
      onSubmit={onSubmit}
      title="Import saved connections"
      submitButtonText="Import"
      submitDisabled={inProgress || !!error || !filename}
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
          items={connectionList}
          columns={[['name', 'Connection Name']]}
          disabled={inProgress}
          onChange={onChangeConnectionList}
        />
      )}
      {error && !passphraseRequired && (
        <Banner variant="danger">Error: {error}</Banner>
      )}
    </FormModal>
  );
}
