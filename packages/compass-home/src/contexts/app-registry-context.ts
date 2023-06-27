import { createContext, useContext, useState } from 'react';
import type React from 'react';
import AppRegistry from 'hadron-app-registry';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

const { debug } = createLoggerAndTelemetry('COMPASS-HOME-UI');

const AppRegistryContext = createContext(new AppRegistry());
export default AppRegistryContext;

export enum AppRegistryRoles {
  APPLICATION_CONNECT = 'Application.Connect',
  FIND_IN_PAGE = 'Find',
  GLOBAL_MODAL = 'Global.Modal',
}

export enum AppRegistryComponents {
  SIDEBAR_COMPONENT = 'Sidebar.Component',
  SHELL_COMPONENT = 'Global.Shell',
  COLLECTION_WORKSPACE = 'Collection.Workspace',
  DATABASE_WORKSPACE = 'Database.Workspace',
  INSTANCE_WORKSPACE = 'Instance.Workspace',
}

export const useAppRegistryContext = (): AppRegistry =>
  useContext(AppRegistryContext);
export const useAppRegistryComponent = (
  componentName: AppRegistryComponents
): React.JSXElementConstructor<unknown> | null => {
  const appRegistry = useContext(AppRegistryContext);

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

export function useAppRegistryRole(
  roleName:
    | AppRegistryRoles.APPLICATION_CONNECT
    | AppRegistryRoles.FIND_IN_PAGE
    | AppRegistryRoles.GLOBAL_MODAL
):
  | {
      component: React.JSXElementConstructor<unknown>;
    }[]
  | null;
export function useAppRegistryRole(roleName: AppRegistryRoles):
  | {
      component: React.JSXElementConstructor<{
        isDataLake?: boolean;
      }>;
    }[]
  | null {
  const appRegistry = useContext(AppRegistryContext);

  const [role] = useState(() => {
    const newRole = appRegistry.getRole(roleName);
    if (!newRole) {
      debug(`home plugin loading role, but ${String(roleName)} is NULL`);
    }
    return newRole;
  });

  return role ? role : null;
}
