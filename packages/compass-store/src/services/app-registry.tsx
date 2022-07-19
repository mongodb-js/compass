import React, { createContext, useContext, useRef } from 'react';
import hadronApp from 'hadron-app';
import type _AppRegistry from 'hadron-app-registry';

export type AppRegistry = Pick<
  _AppRegistry,
  | 'emit'
  | 'on'
  | 'addListener'
  | 'once'
  | 'removeListener'
  | 'removeAllListeners'
>;

const AppRegistryContext = createContext<AppRegistry | null>(null);

export const AppRegistryProvider: React.FunctionComponent<{
  service?: AppRegistry;
}> = ({ service, children }) => {
  const _service = useRef<AppRegistry>();
  if (!_service.current) {
    _service.current = service ?? hadronApp.appRegistry!;
  }
  return (
    <AppRegistryContext.Provider value={_service.current}>
      {children}
    </AppRegistryContext.Provider>
  );
};

/**
 * @internal
 */
export const useAppRegistry = (): AppRegistry => {
  const service = useContext(AppRegistryContext);
  if (!service) {
    throw new Error('Expected to find service in React context');
  }
  return service;
};
