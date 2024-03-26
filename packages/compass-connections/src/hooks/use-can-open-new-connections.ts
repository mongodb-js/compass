import { ConnectionsManagerEvents } from '../connections-manager';
import { useActiveConnections } from './use-active-connections';
import { usePreference } from 'compass-preferences-model/provider';

export type CanNotOpenConnectionReason = 'maximum-number-exceeded';

export function useCanOpenNewConnections(): {
  numberOfConnectionsOpen: number;
  maximumNumberOfConnectionsOpen: number;
  canOpenNewConnection: boolean;
  canNotOpenReason?: CanNotOpenConnectionReason;
} {
  const activeConnections = useActiveConnections();
  const maximumNumberOfConnectionsOpen =
    usePreference('userCanHaveMaximumNumberOfActiveConnections') ?? 1;

  const numberOfConnectionsOpen = activeConnections.length;
  const canOpenNewConnection =
    numberOfConnectionsOpen < maximumNumberOfConnectionsOpen;
  const canNotOpenReason = !canOpenNewConnection
    ? 'maximum-number-exceeded'
    : undefined;

  return {
    numberOfConnectionsOpen,
    maximumNumberOfConnectionsOpen,
    canOpenNewConnection,
    canNotOpenReason,
  };
}
