import type {
  ConnectionStatus,
  ConnectionInfo,
} from '@mongodb-js/connection-info';

export const useConnectionStatus = (
  connectionInfo: ConnectionInfo
): ConnectionStatus => {
  // polyfill
  return 'connected';
};
