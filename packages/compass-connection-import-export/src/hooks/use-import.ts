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

type ImportConnectionsState = CommonImportExportState & {
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
  }: Pick<ImportConnectionsState, 'filename' | 'passphrase'>,
  importConnections: typeof dataServiceImportConnections
): Promise<Partial<ImportConnectionsState>> {
  if (!filename) {
    return INITIAL_STATE;
  }
  try {
    const fileContents = await fs.readFile(filename, 'utf8');
    const connectionList: ConnectionShortInfo[] = [];
    await importConnections(fileContents, {
      passphrase,
      saveConnections(list: ConnectionInfo[]) {
        for (const info of list) {
          if (info.favorite?.name) {
            connectionList.push({
              name: info.favorite.name,
              id: info.id,
              selected: true,
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
    open,
    trackingProps,
  }: {
    finish: (result: ImportExportResult) => void;
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
      void loadFile({ filename, passphrase }, importConnections).then(
        (stateUpdate) => {
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
        }
      );
    }, LOAD_CONNECTIONS_FILE_DEBOUNCE_DELAY);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [filename, passphrase]);

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
