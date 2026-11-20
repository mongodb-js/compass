import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { SidebarThunkAction } from '.';

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
