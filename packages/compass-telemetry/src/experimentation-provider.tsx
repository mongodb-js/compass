import React, { createContext, useContext, useRef } from 'react';
import type { types } from '@mongodb-js/mdb-experiment-js';
import type { typesReact } from '@mongodb-js/mdb-experiment-js/react';

type UseAssignmentHook = (
  experimentName: string,
  trackIsInSample: boolean,
  options?: typesReact.UseAssignmentOptions<types.TypeData>
) => typesReact.UseAssignmentResponse<types.TypeData>;

type AssignExperimentFn = (
  experimentName: string,
  options?: types.AssignOptions<string>
) => Promise<types.AsyncStatus | null>;

interface CompassExperimentationProviderContextValue {
  useAssignment: UseAssignmentHook;
  assignExperiment: AssignExperimentFn;
}

const initialContext: CompassExperimentationProviderContextValue = {
  useAssignment() {
    return {
      assignment: null,
      asyncStatus: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
    };
  },
  assignExperiment() {
    return Promise.resolve(null);
  },
};

const ExperimentationContext =
  createContext<CompassExperimentationProviderContextValue>(initialContext);

// Provider component that accepts MMS experiment utils as props
export const CompassExperimentationProvider: React.FC<{
  children: React.ReactNode;
  useAssignment: UseAssignmentHook;
  assignExperiment: AssignExperimentFn;
}> = ({ children, useAssignment, assignExperiment }) => {
  // Use useRef to keep the functions up-to-date; Use mutation pattern to maintain the
  // same object reference to prevent unnecessary re-renders of consuming components
  const { current: contextValue } = useRef({ useAssignment, assignExperiment });
  contextValue.useAssignment = useAssignment;
  contextValue.assignExperiment = assignExperiment;

  return (
    <ExperimentationContext.Provider value={contextValue}>
      {children}
    </ExperimentationContext.Provider>
  );
};

// Hook for components to access experiment assignment
export const useAssignment = (...args: Parameters<UseAssignmentHook>) => {
  return useContext(ExperimentationContext).useAssignment(...args);
};
