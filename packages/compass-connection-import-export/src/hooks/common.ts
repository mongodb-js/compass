import type { ConnectionInfo } from 'mongodb-data-service';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';

export type ImportExportResult = 'canceled' | 'succeeded';

export type ConnectionShortInfo = {
  id: string;
  name: string;
  selected: boolean;
};

export type CommonImportExportState = {
  filename: string;
  passphrase: string;
  connectionList: ConnectionShortInfo[];
  error: string;
  inProgress: boolean;
};

export const COMMON_INITIAL_STATE: Readonly<CommonImportExportState> =
  Object.freeze({
    filename: '',
    passphrase: '',
    connectionList: [],
    error: '',
    inProgress: false,
  });

export function useImportExportConnectionsCommon<S>(
  setState: Dispatch<SetStateAction<S>>,
  finish: (result: ImportExportResult) => void
) {
  const onCancel = useCallback(() => {
    finish('canceled');
  }, [finish]);

  const onChangeConnectionList = useCallback(
    (connectionList: ConnectionShortInfo[]) => {
      setState((prevState) => ({ ...prevState, connectionList }));
    },
    []
  );

  const onChangePassphrase = useCallback((passphrase: string) => {
    setState((prevState) => ({
      ...prevState,
      passphrase,
    }));
  }, []);

  return { onCancel, onChangeConnectionList, onChangePassphrase };
}

export function makeConnectionInfoFilter(
  connectionList: ConnectionShortInfo[]
) {
  return (info: Pick<ConnectionInfo, 'id'>) => {
    return !!connectionList.find((item) => item.id === info.id)?.selected;
  };
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let ipc_: import('hadron-ipc').HadronIpcRenderer | Record<string, never>;
export function useOpenModalThroughIpc(
  open: boolean,
  setOpen: (newValue: boolean) => void,
  ipcEvent: string,
  ipcForTesting: typeof ipc_ | undefined = undefined
): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ipc_ ??= require('hadron-ipc').ipcRenderer;
  } catch (err) {
    ipc_ ??= {};
    console.warn('could not load hadron-ipc', err);
  }
  const ipc = ipcForTesting ?? ipc_;

  useEffect(() => {
    if (ipc.on && !open) {
      const listener = () => {
        setOpen(true);
      };
      ipc.on(ipcEvent, listener);
      return () => {
        ipc.off(ipcEvent, listener);
      };
    }
  }, [open, setOpen]);
}
