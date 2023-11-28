import React, { useContext, useRef } from 'react';

export type Workspace = {
  name: string;
  component: React.ComponentType;
};

const WorkspacesContext = React.createContext<Workspace[]>([]);

export const WorkspacesProvider: React.FunctionComponent<{
  value: Workspace[];
}> = ({ value, children }) => {
  const valueRef = useRef(value);
  return (
    <WorkspacesContext.Provider value={valueRef.current}>
      {children}
    </WorkspacesContext.Provider>
  );
};

export const useWorkspacePlugin = (name: string) => {
  return (
    useContext(WorkspacesContext).find((workspace) => workspace.name === name)
      ?.component ?? null
  );
};
