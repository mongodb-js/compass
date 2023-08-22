import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  COMMON_INITIAL_STATE,
  useImportExportConnectionsCommon,
} from './common';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { ConnectionStorage } from '@mongodb-js/connection-storage/renderer';
import { promises as fs } from 'fs';
import type {
  ImportExportResult,
  ConnectionShortInfo,
  CommonImportExportState,
} from './common';
import { usePreference } from 'compass-preferences-model';

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

export function useExportConnections(
  {
    finish,
    favoriteConnections,
    open,
    trackingProps,
  }: {
    finish: (result: ImportExportResult) => void;
    favoriteConnections: Pick<ConnectionInfo, 'favorite' | 'id'>[];
    open: boolean;
    trackingProps?: Record<string, unknown>;
  },
  exportConnections = ConnectionStorage.exportConnections.bind(
    ConnectionStorage
  )
): {
  onCancel: () => void;
  onSubmit: () => void;
  onChangeFilename: (filename: string) => void;
  onChangePassphrase: (passphrase: string) => void;
  onChangeConnectionList: (connectionInfos: ConnectionShortInfo[]) => void;
  onChangeRemoveSecrets: (evt: React.ChangeEvent<HTMLInputElement>) => void;
  state: ExportConnectionsState;
} {
  const [state, setState] = useState<ExportConnectionsState>(INITIAL_STATE);
  useEffect(() => setState(INITIAL_STATE), [open]);
  const { passphrase, filename, connectionList, removeSecrets } = state;

  useEffect(() => {
    // If `favoriteConnections` changes, update the list of connections
    // that are displayed in our table.
    if (
      favoriteConnections.map(({ id }) => id).join(',') !==
      state.connectionList.map(({ id }) => id).join(',')
    ) {
      setState((prevState) => ({
        ...prevState,
        connectionList: connectionInfosToConnectionShortInfos(
          favoriteConnections,
          state.connectionList
        ),
      }));
    }
  }, [favoriteConnections, state.connectionList]);

  const protectConnectionStrings = !!usePreference(
    'protectConnectionStrings',
    React
  );
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
        const fileContents = await exportConnections({
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
