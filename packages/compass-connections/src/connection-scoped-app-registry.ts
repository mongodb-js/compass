import {
  type AppRegistry,
  createServiceLocator,
  useGlobalAppRegistry,
} from 'hadron-app-registry';
import {
  type ConnectionInfoAccess,
  connectionInfoAccessLocator,
} from '@mongodb-js/connection-storage/provider';
import { useRef } from 'react';

export type ConnectionScopedAppRegistryLocator<
  T extends string,
  K extends keyof ConnectionScopedAppRegistryImpl<T> = keyof ConnectionScopedAppRegistryImpl<T>,
  L extends keyof ConnectionScopedAppRegistryImpl<T> = K
> = () => ConnectionScopedGlobalAppRegistry<T, K, L>;

export type ConnectionScopedGlobalAppRegistry<
  T extends string,
  K extends keyof ConnectionScopedAppRegistryImpl<T> = keyof ConnectionScopedAppRegistryImpl<T>,
  L extends keyof ConnectionScopedAppRegistryImpl<T> = K
> = Pick<ConnectionScopedAppRegistryImpl<T>, K> &
  Partial<Pick<ConnectionScopedAppRegistryImpl<T>, L>>;

interface EventForwarder<T extends string> {
  emit(event: T, payload?: Record<string, any>): void;
}

export class ConnectionScopedAppRegistryImpl<T extends string>
  implements EventForwarder<T>
{
  constructor(
    private readonly appRegistryEmitter: AppRegistry['emit'],
    private readonly connectionInfoAccess: ConnectionInfoAccess
  ) {}

  emit(event: T, payload: Record<string, any> | null = null): void {
    const sourceConnectionInfoId =
      this.connectionInfoAccess.getCurrentConnectionInfo().id;
    this.appRegistryEmitter(event, payload, {
      sourceConnectionInfoId,
    });
  }
}

export const connectionScopedAppRegistryLocator = createServiceLocator(
  function useConnectionScopedAppRegistry<
    T extends string,
    K extends keyof ConnectionScopedAppRegistryImpl<T> = keyof ConnectionScopedAppRegistryImpl<T>,
    L extends keyof ConnectionScopedAppRegistryImpl<T> = K
  >(): ConnectionScopedGlobalAppRegistry<T, K, L> {
    const appRegistry = useGlobalAppRegistry();
    const connectionInfoAccess = connectionInfoAccessLocator();

    const registry = useRef(
      new ConnectionScopedAppRegistryImpl<T>(
        appRegistry.emit.bind(appRegistry),
        connectionInfoAccess
      )
    );

    return registry.current;
  }
);
