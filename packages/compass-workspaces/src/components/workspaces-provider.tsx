import React, { useContext, useRef } from 'react';
import type { AnyWorkspace, WorkspaceComponent } from '../';

export type AnyWorkspaceComponent =
  | WorkspaceComponent<'Welcome'>
  | WorkspaceComponent<'My Queries'>
  | WorkspaceComponent<'Data Modeling'>
  | WorkspaceComponent<'Shell'>
  | WorkspaceComponent<'Performance'>
  | WorkspaceComponent<'Databases'>
  | WorkspaceComponent<'Collections'>
  | WorkspaceComponent<'Collection'>;

const WorkspacesContext = React.createContext<AnyWorkspaceComponent[]>([]);

export const WorkspacesProvider: React.FunctionComponent<{
  value: AnyWorkspaceComponent[];
}> = ({ value, children }) => {
  const valueRef = useRef(value);
  return (
    <WorkspacesContext.Provider value={valueRef.current}>
      {children}
    </WorkspacesContext.Provider>
  );
};

export const useWorkspacePlugins = () => {
  const workspaces = useContext(WorkspacesContext);
  const workspacePlugins = useRef({
    hasWorkspacePlugin: <T extends AnyWorkspace['type']>(name: T) => {
      return workspaces.some((ws) => ws.name === name);
    },
    getWorkspacePluginByName: <T extends AnyWorkspace['type']>(name?: T) => {
      if (!name) {
        return null;
      }
      const plugin = workspaces.find((ws) => ws.name === name);
      if (!plugin) {
        throw new Error(
          `Component for workspace "${name}" is missing in context. Did you forget to set up WorkspacesProvider?`
        );
      }
      return plugin.component as unknown as WorkspaceComponent<T>['component'];
    },
  });
  return workspacePlugins.current;
};
