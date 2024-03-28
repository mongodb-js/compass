import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  type AppRegistry,
  createServiceLocator,
  useGlobalAppRegistry,
} from 'hadron-app-registry';
import { useConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { useEffect, useRef } from 'react';

type ConnectionScopedGlobalAppRegistryImplKeys<T extends string> = Omit<
  ConnectionScopedGlobalAppRegistryImpl<T>,
  'updateConnectionInfoId'
>;

export type ConnectionScopedGlobalAppRegistryLocator<
  T extends string,
  K extends keyof ConnectionScopedGlobalAppRegistryImplKeys<T> = keyof ConnectionScopedGlobalAppRegistryImplKeys<T>,
  L extends keyof ConnectionScopedGlobalAppRegistryImplKeys<T> = K
> = () => ConnectionScopedGlobalAppRegistry<T, K, L>;

export type ConnectionScopedGlobalAppRegistry<
  T extends string,
  K extends keyof ConnectionScopedGlobalAppRegistryImplKeys<T> = keyof ConnectionScopedGlobalAppRegistryImplKeys<T>,
  L extends keyof ConnectionScopedGlobalAppRegistryImplKeys<T> = K
> = Pick<ConnectionScopedGlobalAppRegistryImpl<T>, K> &
  Partial<Pick<ConnectionScopedGlobalAppRegistryImpl<T>, L>>;

interface EventForwarder<T extends string> {
  emit(event: T, payload?: Record<string, any>): void;
}

export class ConnectionScopedGlobalAppRegistryImpl<T extends string>
  implements EventForwarder<T>
{
  constructor(
    private readonly appRegistryEmitter: AppRegistry['emit'],
    private sourceConnectionInfoId: ConnectionInfo['id']
  ) {}

  updateConnectionInfoId(connectionInfoId: ConnectionInfo['id']) {
    this.sourceConnectionInfoId = connectionInfoId;
  }

  emit(event: T, payload: Record<string, any> = {}): void {
    payload.sourceConnectionInfo = this.sourceConnectionInfoId;
    this.appRegistryEmitter(event, payload);
  }
}

export const connectionScopedGlobalAppRegistryLocator = createServiceLocator(
  function useConnectionScopedGlobalAppRegistry<
    T extends string,
    K extends keyof ConnectionScopedGlobalAppRegistryImplKeys<T> = keyof ConnectionScopedGlobalAppRegistryImplKeys<T>,
    L extends keyof ConnectionScopedGlobalAppRegistryImplKeys<T> = K
  >(): ConnectionScopedGlobalAppRegistry<T, K, L> {
    const appRegistry = useGlobalAppRegistry();
    const connectionInfo = useConnectionInfo();

    const registry = useRef(
      new ConnectionScopedGlobalAppRegistryImpl<T>(
        appRegistry.emit.bind(appRegistry),
        connectionInfo.id
      )
    );

    useEffect(() => {
      registry.current.updateConnectionInfoId(connectionInfo.id);
    }, [connectionInfo.id]);

    return registry.current;
  }
);
