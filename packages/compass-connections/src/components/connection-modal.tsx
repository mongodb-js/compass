import React, { useMemo } from 'react';
import { ConnectionFormModal } from '@mongodb-js/connection-form';
import type { ConnectionFormFolderOption } from '@mongodb-js/connection-form';
import type {
  ConnectionInfo,
  Folder,
} from '@mongodb-js/connection-storage/provider';
import { usePreference } from '@mongodb-js/compass-preferences-model/provider';
import { connect as reduxConnect } from '../stores/store-context';
import {
  connect,
  disconnect,
  cancelEditConnection,
  saveEditedConnectionInfo,
  saveAndConnect,
  openSettingsModal,
} from '../stores/connections-store-redux';

import { useConnectionFormPreferences } from '../hooks/use-connection-form-preferences';

import type {
  ConnectionId,
  ConnectionState,
} from '../stores/connections-store-redux';

function shouldDisableConnectionEditing(connection: ConnectionState): boolean {
  return connection.status === 'connected';
}

function sortFolders(folders: Folder[]): ConnectionFormFolderOption[] {
  return folders
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) =>
      a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())
    );
}

function mapState({
  isEditingConnectionInfoModalOpen,
  editingConnectionInfoId,
  connections,
  folders,
}: {
  isEditingConnectionInfoModalOpen: boolean;
  editingConnectionInfoId?: ConnectionId;
  connections: {
    byId: Record<ConnectionId, ConnectionState>;
  };
  folders: {
    ids: string[];
    byId: Record<string, Folder>;
  };
}) {
  const editingConnection = editingConnectionInfoId
    ? connections.byId[editingConnectionInfoId]
    : undefined;
  const editingConnectionInfo = editingConnection?.info;

  const disableEditingConnectedConnection = editingConnection
    ? shouldDisableConnectionEditing(editingConnection)
    : false;

  return {
    isOpen: isEditingConnectionInfoModalOpen,
    initialConnectionInfo: editingConnectionInfo,
    connectionErrorMessage: editingConnection?.error?.message,
    disableEditingConnectedConnection,
    editingConnectionInfoId,
    isEditingNewConnection: !!editingConnection?.isBeingCreated,
    folders: folders.ids.map((id) => folders.byId[id]),
  };
}

const mapDispatch = {
  connect,
  disconnect,
  cancelEditConnection,
  saveEditedConnectionInfo,
  saveAndConnect,
  openSettingsModal,
};

type ConnectionModalProps = {
  isOpen: boolean;
  initialConnectionInfo?: ConnectionInfo;
  connectionErrorMessage?: string;
  disableEditingConnectedConnection: boolean;
  editingConnectionInfoId?: ConnectionId;
  isEditingNewConnection: boolean;
  folders: Folder[];
  connect: (
    connectionInfo: ConnectionInfo,
    folderId?: string | null
  ) => Promise<void>;
  disconnect: (id: string) => void;
  cancelEditConnection: (id: string) => void;
  saveEditedConnectionInfo: (
    connectionInfo: ConnectionInfo,
    folderId?: string | null
  ) => Promise<void>;
  saveAndConnect: (
    connectionInfo: ConnectionInfo,
    folderId?: string | null
  ) => Promise<void>;
  openSettingsModal: (tab?: string) => void;
};

const ConnectionModal: React.FunctionComponent<ConnectionModalProps> = ({
  // pulling initialConnectionInfo out of props to help TypeScript know that it
  // is not undefined by the time we render ConnectionFormModal
  initialConnectionInfo,
  // pulling editingConnectionInfoId and isEditingNewConnection out of props
  // because they aren't known to ConnectionFormModal and only get used here.
  editingConnectionInfoId,
  isEditingNewConnection,
  folders,
  ...props
}) => {
  const formPreferences = useConnectionFormPreferences();
  const isFoldersEnabled = usePreference('enableConnectionFolders');

  const {
    disableEditingConnectedConnection,
    connect,
    disconnect,
    cancelEditConnection,
    saveEditedConnectionInfo,
    saveAndConnect,
  } = props;

  const folderOptions = useMemo(
    () =>
      isFoldersEnabled && isEditingNewConnection
        ? sortFolders(folders)
        : undefined,
    [isFoldersEnabled, isEditingNewConnection, folders]
  );

  if (!(editingConnectionInfoId && initialConnectionInfo)) {
    return null;
  }

  return (
    <ConnectionFormModal
      initialConnectionInfo={initialConnectionInfo}
      {...props}
      {...formPreferences}
      enableOidc={true}
      folders={folderOptions}
      onDisconnectClicked={() => disconnect(editingConnectionInfoId)}
      setOpen={(newOpen) => {
        // This is how leafygreen propagates `X` button click
        if (newOpen === false) {
          cancelEditConnection(editingConnectionInfoId);
        }
      }}
      onCancel={() => {
        cancelEditConnection(editingConnectionInfoId);
      }}
      onSaveClicked={(connectionInfo, folderId) =>
        saveEditedConnectionInfo(connectionInfo, folderId)
      }
      onConnectClicked={
        isEditingNewConnection || disableEditingConnectedConnection
          ? undefined
          : (connectionInfo, folderId) => {
              void connect(connectionInfo, folderId);
            }
      }
      onSaveAndConnectClicked={
        disableEditingConnectedConnection
          ? undefined
          : (connectionInfo, folderId) => {
              void saveAndConnect(connectionInfo, folderId);
            }
      }
    />
  );
};

export const ConnectedConnectionModal = reduxConnect(
  mapState,
  mapDispatch
)(ConnectionModal);

export default ConnectedConnectionModal;
