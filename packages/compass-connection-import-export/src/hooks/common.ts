import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';
import type { HadronIpcRenderer } from 'hadron-ipc';
import { ipcRenderer } from 'hadron-ipc';

export type ImportExportResult = 'canceled' | 'succeeded';

export type ConnectionShortInfo = {
  id: string;
  name: string;
  selected: boolean;
};

export type CommonImportExportState<
  ConnectionInfoType extends ConnectionShortInfo
> = {
  filename: string;
  passphrase: string;
  connectionList: ConnectionInfoType[];
  error: string;
  inProgress: boolean;
};

export const COMMON_INITIAL_STATE: Readonly<CommonImportExportState<never>> =
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

export function useOpenModalThroughIpc(
  open: boolean,
  setOpen: (newValue: boolean) => void,
  ipcEvent: string,
  ipcForTesting: HadronIpcRenderer | undefined = undefined
): void {
  const ipc = ipcForTesting ?? ipcRenderer;

  useEffect(() => {
    if (ipc?.on && !open) {
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
