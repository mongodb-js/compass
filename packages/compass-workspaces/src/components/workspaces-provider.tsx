import React, { useContext, useRef, useCallback } from 'react';
import type { AnyWorkspace } from '../stores/workspaces';

export type WorkspaceComponent<T extends AnyWorkspace['type']> = {
  name: T;
  component: React.FunctionComponent<
    Omit<Extract<AnyWorkspace, { type: T }>, 'type'>
  >;
};

export type AnyWorkspaceComponent =
  | WorkspaceComponent<'My Queries'>
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

export const useWorkspacePlugin = () => {
  const workspaces = useContext(WorkspacesContext);
  return useCallback(
    <T extends AnyWorkspace['type']>(name: T) => {
      const plugin = workspaces.find((workspace) => workspace.name === name);
      if (!plugin) {
        throw new Error(
          `Component for workspace "${name}" is missing in context. Did you forget to set up WorkspacesProvider?`
        );
      }
      return plugin.component as unknown as WorkspaceComponent<T>['component'];
    },
    [workspaces]
  );
};
