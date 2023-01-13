import { useCallback, useEffect, useState } from 'react';
import type { ConnectionInfo } from 'mongodb-data-service';
import { importConnections as dataServiceImportConnections } from 'mongodb-data-service';
import { promises as fs } from 'fs';
import {
  COMMON_INITIAL_STATE,
  makeConnectionInfoFilter,
  useImportExportConnectionsCommon,
} from './common';
import type {
  ImportExportResult,
  ConnectionShortInfo,
  CommonImportExportState,
} from './common';

type ConnectionImportInfo = ConnectionShortInfo & {
  isExistingFavorite: boolean;
};

type ImportConnectionsState = CommonImportExportState<ConnectionImportInfo> & {
  passphraseRequired: boolean;
  fileContents: string;
};

const INITIAL_STATE: Readonly<ImportConnectionsState> = Object.freeze({
  ...COMMON_INITIAL_STATE,
  passphraseRequired: false,
  fileContents: '',
});

async function loadFile(
  {
    filename,
    passphrase,
    favoriteConnectionIds,
  }: Pick<ImportConnectionsState, 'filename' | 'passphrase'> & {
    favoriteConnectionIds: string[];
  },
  importConnections: typeof dataServiceImportConnections
): Promise<Partial<ImportConnectionsState>> {
  if (!filename) {
    return INITIAL_STATE;
  }
  try {
    const fileContents = await fs.readFile(filename, 'utf8');
    const connectionList: ConnectionImportInfo[] = [];
    await importConnections(fileContents, {
      passphrase,
      saveConnections(list: ConnectionInfo[]) {
        for (const info of list) {
          if (info.favorite?.name) {
            const isExistingFavorite = favoriteConnectionIds.includes(info.id);
            connectionList.push({
              name: info.favorite.name,
              id: info.id,
              selected: !isExistingFavorite,
              isExistingFavorite,
            });
          }
        }
      },
    });
    if (connectionList.length === 0) {
      throw new Error('File does not contain any connections');
    }
    return {
      fileContents,
      connectionList,
      error: '',
    };
  } catch (err: any) {
    return {
      fileContents: '',
      connectionList: [],
      error: err.message,
      ...(err.passphraseRequired && { passphraseRequired: true }),
    };
  }
}

export function useImportConnections(
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
  importConnections = dataServiceImportConnections
): {
  onCancel: () => void;
  onSubmit: () => void;
  onChangeFilename: (filename: string) => void;
  onChangePassphrase: (passphrase: string) => void;
  onChangeConnectionList: (connectionInfos: ConnectionShortInfo[]) => void;
  state: ImportConnectionsState;
} {
  const [state, setState] = useState<ImportConnectionsState>(INITIAL_STATE);
  useEffect(() => setState(INITIAL_STATE), [open]);
  const { passphrase, filename, fileContents, connectionList } = state;

  const favoriteConnectionIds = favoriteConnections.map(({ id }) => id);
  useEffect(() => {
    // If `favoriteConnections` changes, update the list of connections
    // that are displayed in our table.
    setState((prevState) => ({
      ...prevState,
      connectionList: state.connectionList.map((conn) => ({
        ...conn,
        isExistingFavorite: favoriteConnectionIds.includes(conn.id),
      })),
    }));
  }, [favoriteConnectionIds.join(',')]);

  const { onChangeConnectionList, onChangePassphrase, onCancel } =
    useImportExportConnectionsCommon(setState, finish);

  const onSubmit = useCallback(() => {
    setState((prevState) => ({ ...prevState, inProgress: true }));
    void (async () => {
      const filter = makeConnectionInfoFilter(connectionList);
      try {
        await importConnections(fileContents, {
          passphrase,
          filter,
          trackingProps,
        });
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
  }, [connectionList, fileContents, passphrase, finish]);

  const LOAD_CONNECTIONS_FILE_DEBOUNCE_DELAY = 100;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    timer = setTimeout(() => {
      timer = undefined;
      void loadFile(
        { filename, passphrase, favoriteConnectionIds },
        importConnections
      ).then((stateUpdate) => {
        setState((prevState) => {
          if (
            // Only update the state if filename and passphrase haven't changed
            // while loading the connections list
            filename === prevState.filename &&
            passphrase === prevState.passphrase
          )
            return { ...prevState, ...stateUpdate };
          return prevState;
        });
      });
    }, LOAD_CONNECTIONS_FILE_DEBOUNCE_DELAY);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [filename, passphrase, favoriteConnectionIds.join(',')]);

  const onChangeFilename = useCallback((filename: string) => {
    setState((prevState) => ({
      ...prevState,
      filename,
      ...(filename !== prevState.filename && {
        error: '',
        passphraseRequired: false,
      }),
    }));
  }, []);

  return {
    onCancel,
    onSubmit,
    onChangeFilename,
    onChangePassphrase,
    onChangeConnectionList,
    state,
  };
}
