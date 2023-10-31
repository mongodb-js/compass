import React, { createContext, useContext, useState } from 'react';
import type { AppRegistry } from './app-registry';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

const { debug } = createLoggerAndTelemetry('COMPASS-HOME-UI');

const AppRegistryContext = createContext<AppRegistry | null>(null);
interface AppRegistryProviderProps {
  localAppRegistry: AppRegistry;
  children: React.ReactNode;
}

export function AppRegistryProvider({
  localAppRegistry,
  children,
}: AppRegistryProviderProps) {
  return React.createElement(AppRegistryContext.Provider, {
    value: localAppRegistry,
    children,
  });
}

export const useAppRegistryContext = (): AppRegistry => {
  const appRegistry = useContext(AppRegistryContext);
  if (!appRegistry) {
    throw new Error(`No AppRegistry registered within this context`);
  }
  return appRegistry;
};

export const useAppRegistryComponent = (
  componentName: string
): React.JSXElementConstructor<unknown> | null => {
  const appRegistry = useAppRegistryContext();

  const [component] = useState(() => {
    const newComponent = appRegistry.getComponent(componentName);
    if (!newComponent) {
      debug(
        `home plugin loading component, but ${String(componentName)} is NULL`
      );
    }
    return newComponent;
  });

  return component ? component : null;
};

export function useAppRegistryRole(roleName: string):
  | {
      component: React.JSXElementConstructor<unknown>;
      name: string;
    }[]
  | null {
  const appRegistry = useAppRegistryContext();

  const [role] = useState(() => {
    const newRole = appRegistry.getRole(roleName);
    if (!newRole) {
      debug(`home plugin loading role, but ${String(roleName)} is NULL`);
    }
    return newRole;
  });

  return role ? role : null;
}
