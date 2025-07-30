import React, { createContext, useContext, useRef } from 'react';
import type { types } from '@mongodb-js/mdb-experiment-js';
import type { typesReact } from '@mongodb-js/mdb-experiment-js/react';

type UseAssignmentHookFn = (
  experimentName: string,
  trackIsInSample: boolean,
  options?: types.GetAssignmentOptions<types.TypeData>
) => typesReact.UseAssignmentResponse<types.TypeData>;

type AssignExperimentFn = (
  experimentName: string,
  options?: types.AssignOptions<string>
) => Promise<'SUCCESS' | 'ERROR' | null>;

interface CompassExperimentationProviderContextValue {
  useAssignment: UseAssignmentHookFn;
  assignExperiment: AssignExperimentFn;
}

const ExperimentationContext =
  createContext<CompassExperimentationProviderContextValue>({
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
  });

// Provider component that accepts MMS experiment utils as props
export const CompassExperimentationProvider: React.FC<{
  children: React.ReactNode;
  useAssignment: UseAssignmentHookFn;
  assignExperiment: AssignExperimentFn;
}> = ({ children, useAssignment, assignExperiment }) => {
  // Maintain stable object reference for context value to prevent unnecessary re-renders
  // of consuming components, while keeping the function implementations up-to-date
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
export const useAssignment = (...args: Parameters<UseAssignmentHookFn>) => {
  return useContext(ExperimentationContext).useAssignment(...args);
};
