import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  type AppRegistry,
  createServiceLocator,
  useGlobalAppRegistry,
} from 'hadron-app-registry';
import { useConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { useMemo } from 'react';

type ConnectionScopedGlobalAppRegistryEvents =
  | 'schema-analyzed'
  | 'documents-refreshed'
  | 'documents-paginated'
  | 'document-inserted';

export type ConnectionScopedGlobalAppRegistryLocator<
  T extends ConnectionScopedGlobalAppRegistryEvents,
  K extends keyof ConnectionScopedGlobalAppRegistryImpl<T> = keyof ConnectionScopedGlobalAppRegistryImpl<T>,
  L extends keyof ConnectionScopedGlobalAppRegistryImpl<T> = K
> = () => ConnectionScopedGlobalAppRegistry<T, K, L>;

export type ConnectionScopedGlobalAppRegistry<
  T extends ConnectionScopedGlobalAppRegistryEvents,
  K extends keyof ConnectionScopedGlobalAppRegistryImpl<T> = keyof ConnectionScopedGlobalAppRegistryImpl<T>,
  L extends keyof ConnectionScopedGlobalAppRegistryImpl<T> = K
> = Pick<ConnectionScopedGlobalAppRegistryImpl<T>, K> &
  Partial<Pick<ConnectionScopedGlobalAppRegistryImpl<T>, L>>;

interface EventForwarder<T extends ConnectionScopedGlobalAppRegistryEvents> {
  emit(event: T, payload?: Record<string, any>): void;
}

export class ConnectionScopedGlobalAppRegistryImpl<
  T extends ConnectionScopedGlobalAppRegistryEvents
> implements EventForwarder<T>
{
  constructor(
    private readonly appRegistryEmitter: AppRegistry['emit'],
    private readonly sourceConnectionInfo: ConnectionInfo
  ) {}

  emit(event: T, payload: Record<string, any> = {}): void {
    payload.sourceConnectionInfo = this.sourceConnectionInfo;
    this.appRegistryEmitter(event, payload);
  }
}

export const connectionScopedGlobalAppRegistryLocator = createServiceLocator(
  function useConnectionScopedGlobalAppRegistry<
    T extends ConnectionScopedGlobalAppRegistryEvents,
    K extends keyof ConnectionScopedGlobalAppRegistryImpl<T> = keyof ConnectionScopedGlobalAppRegistryImpl<T>,
    L extends keyof ConnectionScopedGlobalAppRegistryImpl<T> = K
  >(): ConnectionScopedGlobalAppRegistry<T, K, L> {
    const appRegistry = useGlobalAppRegistry();
    const connectionInfo = useConnectionInfo();

    const registry = useMemo(() => {
      return new ConnectionScopedGlobalAppRegistryImpl<T>(
        appRegistry.emit.bind(appRegistry),
        connectionInfo
      );
    }, [appRegistry, connectionInfo]);

    return registry;
  }
);
