import React, { useContext, useRef } from 'react';
import type { AnyWorkspace } from '../';
import type { WorkspacePlugin } from '../types';

export type AnyWorkspacePlugin =
  | WorkspacePlugin<'Welcome'>
  | WorkspacePlugin<'My Queries'>
  | WorkspacePlugin<'Data Modeling'>
  | WorkspacePlugin<'Shell'>
  | WorkspacePlugin<'Performance'>
  | WorkspacePlugin<'Databases'>
  | WorkspacePlugin<'Collections'>
  | WorkspacePlugin<'Collection'>;

const WorkspacesContext = React.createContext<AnyWorkspacePlugin[]>([]);

export const WorkspacesProvider: React.FunctionComponent<{
  value: AnyWorkspacePlugin[];
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
    getWorkspacePlugins: (): AnyWorkspacePlugin[] => {
      return workspaces;
    },
    getWorkspacePluginByName: <T extends AnyWorkspace['type']>(name: T) => {
      const plugin = workspaces.find((ws) => ws.name === name);
      if (!plugin) {
        throw new Error(
          `Component for workspace "${name}" is missing in context. Did you forget to set up WorkspacesProvider?`
        );
      }
      return plugin as unknown as WorkspacePlugin<T>;
    },
  });
  return workspacePlugins.current;
};
