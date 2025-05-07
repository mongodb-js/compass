import React, { useCallback } from 'react';
import {
  Banner,
  Checkbox,
  css,
  FormFieldContainer,
  FormModal,
  openToast,
  SelectList,
} from '@mongodb-js/compass-components';
import { FileInput } from './file-input';
import { Passphrase } from './passphrase';
import type { ImportExportResult } from '../hooks/common';
import { useOpenModalThroughIpc } from '../hooks/common';
import { useExportConnections } from '../hooks/use-export-connections';
import { usePreference } from 'compass-preferences-model/provider';

const TOAST_TIMEOUT_MS = 5000;
const tableStyles = css({
  maxHeight: '24vh',
  overflow: 'auto',
});

const SelectListLabel = {
  displayLabelKey: 'name',
  name: 'Connection Name',
} as const;

export function ExportConnectionsModal({
  open,
  setOpen,
  afterExport,
  trackingProps,
}: {
  open: boolean;
  setOpen: (newOpen: boolean, trackingProps?: Record<string, unknown>) => void;
  afterExport?: () => void;
  trackingProps?: Record<string, unknown>;
}): React.ReactElement {
  const finish = useCallback(
    (result: ImportExportResult) => {
      setOpen(false);
      if (result === 'succeeded') {
        openToast('compass-connection-import-export--export-succeeded', {
          title: 'Export successful',
          description: 'Connections successfully exported',
          variant: 'success',
          timeout: TOAST_TIMEOUT_MS,
        });
        afterExport?.();
      }
    },
    [afterExport, setOpen]
  );

  const openModalThroughIpc = useCallback(() => {
    setOpen(true, { context: 'menuBar' });
  }, [setOpen]);

  useOpenModalThroughIpc(
    open,
    openModalThroughIpc,
    'compass:open-export-connections'
  );

  const protectConnectionStrings = !!usePreference('protectConnectionStrings');
  const {
    onSubmit,
    onCancel,
    onChangeFilename,
    onChangePassphrase,
    onChangeConnectionList,
    onChangeRemoveSecrets,
    state: {
      inProgress,
      error,
      connectionList,
      filename,
      removeSecrets,
      passphrase,
    },
  } = useExportConnections({
    finish,
    open,
    trackingProps,
  });

  return (
    <FormModal
      open={open}
      onCancel={onCancel}
      onSubmit={onSubmit}
      title="Export saved connections"
      submitButtonText="Export"
      submitDisabled={
        inProgress ||
        !!error ||
        !filename ||
        connectionList.every((item) => !item.selected)
      }
      data-testid="connection-export-modal"
    >
      <SelectList
        className={tableStyles}
        items={connectionList}
        label={SelectListLabel}
        disabled={inProgress}
        onChange={onChangeConnectionList}
      />
      <FormFieldContainer>
        <FileInput
          label="Target File"
          mode="save"
          disabled={inProgress}
          onChange={onChangeFilename}
          value={filename}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Checkbox
          checked={removeSecrets}
          disabled={inProgress || protectConnectionStrings}
          label="Remove Secrets"
          description="Omit secrets such as passwords and access tokens"
          onChange={onChangeRemoveSecrets}
          data-testid="connection-export-remove-secrets"
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Passphrase
          label="Encryption Password"
          description="Optional passphrase to encrypt secrets such as passwords and access tokens"
          required={false}
          disabled={inProgress || removeSecrets}
          onChange={onChangePassphrase}
          value={passphrase}
        />
      </FormFieldContainer>
      {error && <Banner variant="danger">Error: {error}</Banner>}
    </FormModal>
  );
}
