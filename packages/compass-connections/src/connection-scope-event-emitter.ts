import { ConnectionInfo } from '@mongodb-js/connection-info';
import AppRegistry, {
  createServiceLocator,
  useGlobalAppRegistry,
} from 'hadron-app-registry';
import { useConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { useMemo } from 'react';

interface EventForwarder<T extends string> {
  emit(event: T, payload?: Record<string, any>): void;
}

export class ConnectionScopedGlobalAppRegistry<T extends string>
  implements EventForwarder<T>
{
  constructor(
    private readonly appRegistryEmitter: AppRegistry['emit'],
    private readonly sourceConnectionInfo: ConnectionInfo
  ) {}

  emit(event: T, payload?: Record<string, any>): void {
    if (payload) {
      payload.sourceConnectionInfo = this.sourceConnectionInfo;
    }

    this.appRegistryEmitter(event, payload);
  }
}

export const connectionScopedEventEmitterLocator = createServiceLocator(
  function useConnectionScopedEventEmitter<
    T extends string,
    K extends keyof ConnectionScopedGlobalAppRegistry<T> = keyof ConnectionScopedGlobalAppRegistry<T>,
    L extends keyof ConnectionScopedGlobalAppRegistry<T> = K
  >(): Pick<ConnectionScopedGlobalAppRegistry<T>, K> &
    Partial<Pick<ConnectionScopedGlobalAppRegistry<T>, L>> {
    const appRegistry = useGlobalAppRegistry();
    const connectionInfo = useConnectionInfo();

    const registry = useMemo(() => {
      return new ConnectionScopedGlobalAppRegistry<T>(
        appRegistry.emit.bind(appRegistry),
        connectionInfo
      );
    }, [appRegistry, connectionInfo]);

    return registry;
  }
);
