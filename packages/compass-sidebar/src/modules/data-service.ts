import type { SidebarThunkAction } from '.';
import { ConnectionInfo } from '@mongodb-js/connection-info';

export const setConnectionIsCSFLEEnabled = (
  connectionId: ConnectionInfo['id'],
  enable: boolean
): SidebarThunkAction<void, never> => {
  return (_dispatch, _getState, { globalAppRegistry, connectionsManager }) => {
    const dataService =
      connectionsManager.getDataServiceForConnection(connectionId);

    if (!dataService) {
      // This should be unreachable because this is only visible when
      // we are connected.
      return;
    }

    dataService.setCSFLEEnabled(enable);
    queueMicrotask(() => {
      globalAppRegistry?.emit('refresh-data');
    });
  };
};
