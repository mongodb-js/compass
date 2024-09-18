import {
  type AppRegistry,
  createServiceLocator,
  useGlobalAppRegistry,
} from 'hadron-app-registry';
import type { ConnectionInfoRef } from './connection-info-provider';
import { connectionInfoRefLocator } from './connection-info-provider';

export type ConnectionScopedAppRegistryLocator<
  T extends string,
  K extends keyof ConnectionScopedAppRegistryImpl<T> = keyof ConnectionScopedAppRegistryImpl<T>,
  L extends keyof ConnectionScopedAppRegistryImpl<T> = K
> = () => ConnectionScopedAppRegistry<T, K, L>;

export type ConnectionScopedAppRegistry<
  T extends string,
  K extends keyof ConnectionScopedAppRegistryImpl<T> = keyof ConnectionScopedAppRegistryImpl<T>,
  L extends keyof ConnectionScopedAppRegistryImpl<T> = K
> = Pick<ConnectionScopedAppRegistryImpl<T>, K> &
  Partial<Pick<ConnectionScopedAppRegistryImpl<T>, L>>;

interface EventForwarder<T extends string> {
  emit(event: T, ...payload: any[]): void;
}

export class ConnectionScopedAppRegistryImpl<T extends string>
  implements EventForwarder<T>
{
  constructor(
    private readonly appRegistryEmitter: AppRegistry['emit'],
    private readonly connectionInfoRef: ConnectionInfoRef
  ) {}

  /**
   * @deprecated
   * Moving forward we would like to get away from emitting events on
   * AppRegistry (both ConnectionScopedAppRegistry and GlobalAppRegistry) to
   * communicate between plugins in Compass which is why the usage of this
   * method should be as sparse as possible. So far we expect only the global
   * modals to still be relying on ConnectionScopedAppRegistry.emit but other
   * than those places, usage of this method in any other place is not
   * recommended. Read compass-field-store plugin and compass-workspaces plugin
   * to understand how other plugins communicate with these plugins without
   * relying on AppRegistry events.
   */
  emit(event: T, ...payload: any[]): void {
    const connectionId = this.connectionInfoRef.current.id;
    this.appRegistryEmitter(event, ...payload, { connectionId });
  }
}

export const connectionScopedAppRegistryLocator = createServiceLocator(
  function useConnectionScopedAppRegistry<
    T extends string,
    K extends keyof ConnectionScopedAppRegistryImpl<T> = keyof ConnectionScopedAppRegistryImpl<T>,
    L extends keyof ConnectionScopedAppRegistryImpl<T> = K
  >(): ConnectionScopedAppRegistry<T, K, L> {
    const appRegistry = useGlobalAppRegistry();
    const connectionInfoRef = connectionInfoRefLocator();

    return new ConnectionScopedAppRegistryImpl<T>(
      appRegistry.emit.bind(appRegistry),
      connectionInfoRef
    );
  }
);
