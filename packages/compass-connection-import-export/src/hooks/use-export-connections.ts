import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  COMMON_INITIAL_STATE,
  useImportExportConnectionsCommon,
} from './common';
import {
  type ConnectionInfo,
  useConnectionStorageContext,
} from '@mongodb-js/connection-storage/provider';
import { promises as fs } from 'fs';
import type {
  ImportExportResult,
  ConnectionShortInfo,
  CommonImportExportState,
} from './common';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionsList } from '@mongodb-js/compass-connections/provider';

type ExportConnectionsState = CommonImportExportState<ConnectionShortInfo> & {
  removeSecrets: boolean;
};

const INITIAL_STATE: Readonly<ExportConnectionsState> = Object.freeze({
  ...COMMON_INITIAL_STATE,
  removeSecrets: false,
});

function connectionInfosToConnectionShortInfos(
  infos: Pick<ConnectionInfo, 'favorite' | 'id'>[],
  existingShortInfoList?: ConnectionShortInfo[]
): ConnectionShortInfo[] {
  return infos.map((conn) => ({
    id: conn.id,
    name: conn.favorite?.name ?? '',
    selected:
      existingShortInfoList?.find(({ id }) => id === conn.id)?.selected ?? true,
  }));
}

export function useExportConnections({
  finish,
  open,
  trackingProps,
}: {
  finish: (result: ImportExportResult) => void;
  open: boolean;
  trackingProps?: Record<string, unknown>;
}): {
  onCancel: () => void;
  onSubmit: () => void;
  onChangeFilename: (filename: string) => void;
  onChangePassphrase: (passphrase: string) => void;
  onChangeConnectionList: (connectionInfos: ConnectionShortInfo[]) => void;
  onChangeRemoveSecrets: (evt: React.ChangeEvent<HTMLInputElement>) => void;
  state: ExportConnectionsState;
} {
  const connectionsToExport = useConnectionsList((conn) => {
    return !conn.isBeingCreated && !conn.isAutoconnectInfo;
  });
  const connectionStorage = useConnectionStorageContext();
  const exportConnectionsImpl =
    connectionStorage.exportConnections?.bind(connectionStorage);
  if (!exportConnectionsImpl) {
    throw new Error(
      'Export Connections feature requires the provided ConnectionStorage to implement exportConnections'
    );
  }

  const [state, setState] = useState<ExportConnectionsState>(INITIAL_STATE);
  useEffect(() => {
    setState((prevState) => {
      return {
        // Reset the form state to initial when modal is open, but keep the list
        ...INITIAL_STATE,
        connectionList: prevState.connectionList,
      };
    });
  }, [open]);
  const { passphrase, filename, connectionList, removeSecrets } = state;

  useEffect(() => {
    // If `connectionsToExport` changes, update the list of connections
    // that are displayed in our table.
    setState((prevState) => ({
      ...prevState,
      connectionList: connectionInfosToConnectionShortInfos(
        connectionsToExport.map((conn) => {
          return conn.info;
        }),
        prevState.connectionList
      ),
    }));
  }, [connectionsToExport]);

  const protectConnectionStrings = !!usePreference('protectConnectionStrings');
  useEffect(() => {
    if (protectConnectionStrings) {
      setState((prevState) => ({ ...prevState, removeSecrets: true }));
    }
  }, [protectConnectionStrings, state.removeSecrets]);

  const { onChangeConnectionList, onChangePassphrase, onCancel } =
    useImportExportConnectionsCommon(setState, finish);

  const onSubmit = useCallback(() => {
    setState((prevState) => ({ ...prevState, inProgress: true }));
    void (async () => {
      const filterConnectionIds = connectionList
        .filter((x) => x.selected)
        .map((x) => x.id);
      // exportConnections() rejects specifying both removeSecrets + passphrase; here,
      // in the UI, we protect users against combining them by disabling the passphrase input.
      const passphrase = removeSecrets ? '' : state.passphrase;
      try {
        const fileContents = await exportConnectionsImpl({
          options: {
            passphrase,
            filterConnectionIds,
            trackingProps,
            removeSecrets,
          },
        });
        await fs.writeFile(filename, fileContents);
      } catch (err: any) {
        setState((prevState) => {
          return {
            ...prevState,
            inProgress: false,
            error: err.message,
          };
        });
        return;
      }
      finish('succeeded');
    })();
  }, [connectionList, passphrase, removeSecrets, filename, finish]);

  const onChangeFilename = useCallback((filename: string) => {
    setState((prevState) => ({
      ...prevState,
      filename,
      ...(filename !== prevState.filename && { error: '' }),
    }));
  }, []);

  const onChangeRemoveSecrets = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setState((prevState) => ({
        ...prevState,
        removeSecrets: evt.target.checked || protectConnectionStrings,
      }));
    },
    [protectConnectionStrings]
  );

  return {
    onCancel,
    onSubmit,
    onChangeFilename,
    onChangePassphrase,
    onChangeConnectionList,
    onChangeRemoveSecrets,
    state,
  };
}
