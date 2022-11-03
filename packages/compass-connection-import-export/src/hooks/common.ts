import type { ConnectionInfo } from 'mongodb-data-service';
import type { Dispatch, SetStateAction } from 'react';
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

  return { onCancel, onChangeConnectionList };
}

export function makeConnectionInfoFilter(
  connectionList: ConnectionShortInfo[]
) {
  return (info: Pick<ConnectionInfo, 'id'>) => {
    return !!connectionList.find((item) => item.id === info.id)?.selected;
  };
}
