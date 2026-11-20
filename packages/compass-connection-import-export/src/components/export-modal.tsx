import React, { useCallback, useMemo } from 'react';
import { ipcRenderer } from '@mongodb-js/hadron-ipc';
import {
  Banner,
  Checkbox,
  css,
  FormFieldContainer,
  FormModal,
  openToast,
  SelectList,
  SelectListWithGroups,
  ToastBody,
} from '@mongodb-js/compass-components';
import { usePreference } from '@mongodb-js/compass-preferences-model/provider';
import { useFolders } from '@mongodb-js/compass-connections/provider';
import type { ImportExportResult } from '../hooks/common';
import { useOpenModalThroughIpc } from '../hooks/common';
import { useExportConnections } from '../hooks/use-export-connections';
import { FileInput } from './file-input';
import { Passphrase } from './passphrase';
import { groupByFolder } from './group-by-folder';

const tableStyles = css({
  maxHeight: '50vh',
  overflow: 'auto',
});

const SelectListLabel = {
  displayLabelKey: 'name',
  name: 'Folder & connection Name',
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
    (result: ImportExportResult, filename?: string) => {
      setOpen(false);
      if (result === 'succeeded' && filename) {
        openToast('compass-connection-import-export--export-succeeded', {
          title: 'Export successful',
          description: (
            <ToastBody
              statusMessage="Connections successfully exported"
              actionHandler={() => ipcRenderer?.send('show-file', filename)}
              actionText="show file"
            />
          ),
          variant: 'success',
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

  const enableConnectionFolders = usePreference('enableConnectionFolders');
  const { folders, folderAssignments } = useFolders();
  const groups = useMemo(
    () =>
      enableConnectionFolders && folders.length > 0
        ? groupByFolder(connectionList, folders, folderAssignments)
        : null,
    [enableConnectionFolders, folders, folderAssignments, connectionList]
  );

  const listProps = {
    className: tableStyles,
    label: SelectListLabel,
    disabled: inProgress,
    onChange: onChangeConnectionList,
  };

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
      {groups ? (
        <SelectListWithGroups groups={groups} {...listProps} />
      ) : (
        <SelectList items={connectionList} {...listProps} />
      )}
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
