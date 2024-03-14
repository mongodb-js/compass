import type {
  ConnectionStatus,
  ConnectionInfo,
} from '@mongodb-js/connection-info';

// Placeholder, we won't keep this here
export const useConnectionStatus = (
  connectionInfo: ConnectionInfo
): ConnectionStatus => {
  // polyfill
  return 'connected';
};
