import React, { useCallback, useMemo } from 'react';
import { ipcRenderer } from '@mongodb-js/hadron-ipc';
import {
  Banner,
  Checkbox,
  css,
  FormFieldContainer,
  FolderIcon,
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
  const groups = useMemo(() => {
    if (!enableConnectionFolders || folders.length === 0) {
      return null;
    }
    // Same order as the sidebar.
    const sortedFolders = folders
      .slice()
      .sort((a, b) =>
        a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())
      );
    const folderIds = new Set(folders.map((folder) => folder.id));
    return [
      ...sortedFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        icon: <FolderIcon />,
        items: connectionList.filter(
          (item) => folderAssignments[item.id] === folder.id
        ),
      })),
      {
        id: 'uncategorized',
        name: 'Uncategorized',
        items: connectionList.filter(
          (item) => !folderIds.has(folderAssignments[item.id])
        ),
      },
    ].filter((group) => group.items.length > 0);
  }, [enableConnectionFolders, folders, folderAssignments, connectionList]);

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
        <SelectListWithGroups
          className={tableStyles}
          groups={groups}
          label={SelectListLabel}
          disabled={inProgress}
          onChange={onChangeConnectionList}
        />
      ) : (
        <SelectList
          className={tableStyles}
          items={connectionList}
          label={SelectListLabel}
          disabled={inProgress}
          onChange={onChangeConnectionList}
        />
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
