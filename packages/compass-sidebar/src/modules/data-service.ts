import type { SidebarThunkAction } from '.';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

export const setConnectionIsCSFLEEnabled = (
  connectionId: ConnectionInfo['id'],
  enable: boolean
): SidebarThunkAction<void, never> => {
  return (_dispatch, _getState, { globalAppRegistry, connections }) => {
    const dataService = connections.getDataServiceForConnection(connectionId);
    dataService.setCSFLEEnabled(enable);
    queueMicrotask(() => {
      globalAppRegistry?.emit('refresh-data');
    });
  };
};
