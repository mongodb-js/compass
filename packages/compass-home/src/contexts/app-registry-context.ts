import React, { createContext, useContext, useState } from 'react';
import AppRegistry from 'hadron-app-registry';
import debugModule from 'debug';

const debug = debugModule('mongodb-compass:home:app-registry-context');

const AppRegistryContext = createContext(new AppRegistry());
export default AppRegistryContext;

export enum AppRegistryRoles {
  COLLECTION_WORKSPACE = 'Collection.Workspace',
  APPLICATION_CONNECT = 'Application.Connect',
  INSTANCE_WORKSPACE = 'Instance.Workspace',
  DATABASE_WORKSPACE = 'Database.Workspace',
  FIND_IN_PAGE = 'Find',
  GLOBAL_MODAL = 'Global.Modal',
}

export enum AppRegistryComponents {
  SIDEBAR_COMPONENT = 'Sidebar.Component',
  SHELL_COMPONENT = 'Global.Shell',
}

export enum AppRegistryActions {
  STATUS_ACTIONS = 'Status.Actions',
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
    | AppRegistryRoles.COLLECTION_WORKSPACE
    | AppRegistryRoles.INSTANCE_WORKSPACE
):
  | {
      component: React.JSXElementConstructor<{
        isDataLake?: boolean;
      }>;
    }[]
  | null;
export function useAppRegistryRole(
  roleName:
    | AppRegistryRoles.DATABASE_WORKSPACE
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
