import { useCallback, useEffect, useState } from 'react';
import {
  type ConnectionStorage,
  useConnectionStorageContext,
} from '@mongodb-js/connection-storage/provider';
import { promises as fs } from 'fs';
import {
  COMMON_INITIAL_STATE,
  useImportExportConnectionsCommon,
} from './common';
import type {
  ImportExportResult,
  ConnectionShortInfo,
  CommonImportExportState,
} from './common';
import {
  useConnectionActions,
  useConnectionsList,
} from '@mongodb-js/compass-connections/provider';

type ConnectionImportInfo = ConnectionShortInfo & {
  isExistingConnection: boolean;
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
    existingConnectionIds,
  }: Pick<ImportConnectionsState, 'filename' | 'passphrase'> & {
    existingConnectionIds: string[];
  },
  deserializeConnections: Required<ConnectionStorage>['deserializeConnections']
): Promise<Partial<ImportConnectionsState>> {
  if (!filename) {
    return INITIAL_STATE;
  }
  try {
    const fileContents = await fs.readFile(filename, 'utf8');
    const connectionList: ConnectionImportInfo[] = [];
    const connections = await deserializeConnections({
      content: fileContents,
      options: {
        passphrase,
      },
    });

    for (const info of connections) {
      if (info.favorite?.name) {
        const isExistingConnection = existingConnectionIds.includes(info.id);
        connectionList.push({
          name: info.favorite.name,
          id: info.id,
          selected: !isExistingConnection,
          isExistingConnection,
        });
      }
    }

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

export function useImportConnections({
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
  state: ImportConnectionsState;
} {
  const existingConnections = useConnectionsList((conn) => {
    return !conn.isBeingCreated && !conn.isAutoconnectInfo;
  });
  const { importConnections } = useConnectionActions();
  const connectionStorage = useConnectionStorageContext();
  const deserializeConnectionsImpl =
    connectionStorage.deserializeConnections?.bind(connectionStorage);
  if (!deserializeConnectionsImpl) {
    throw new Error(
      'Import Connections feature requires the provided ConnectionStorage to implement importConnections and deserializeConnections'
    );
  }

  const [state, setState] = useState<ImportConnectionsState>(INITIAL_STATE);
  useEffect(() => {
    // Reset the form state to initial when modal is open, but keep the list
    setState((prevState) => {
      return {
        ...INITIAL_STATE,
        connectionList: prevState.connectionList,
      };
    });
  }, [open]);
  const { passphrase, filename, fileContents, connectionList } = state;

  const existingConnectionIds = existingConnections.map(({ info }) => info.id);
  useEffect(() => {
    // If `existingConnections` changes, update the list of connections that are
    // displayed in our table.
    setState((prevState) => ({
      ...prevState,
      connectionList: state.connectionList.map((conn) => ({
        ...conn,
        isExistingConnection: existingConnectionIds.includes(conn.id),
      })),
    }));
  }, [existingConnectionIds.join(',')]);

  const { onChangeConnectionList, onChangePassphrase, onCancel } =
    useImportExportConnectionsCommon(setState, finish);

  const onSubmit = useCallback(() => {
    setState((prevState) => ({ ...prevState, inProgress: true }));
    void (async () => {
      const filterConnectionIds = connectionList
        .filter((x) => x.selected)
        .map((x) => x.id);
      try {
        await importConnections({
          content: fileContents,
          options: {
            passphrase,
            filterConnectionIds,
            trackingProps: {
              ...trackingProps,
              connection_ids: filterConnectionIds,
            },
          },
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
        { filename, passphrase, existingConnectionIds },
        deserializeConnectionsImpl
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
  }, [filename, passphrase, existingConnectionIds.join(',')]);

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
