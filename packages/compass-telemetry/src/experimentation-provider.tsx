import React, { createContext, useContext, useMemo } from 'react';

interface ExperimentAssignmentData {
  variant: string | null;
  isInSample: boolean;
}

interface ExperimentData {
  assignmentDate: Date;
  entityId: string;
  entityType: string;
  id: string;
  tag: string;
  testGroupDatabaseId: string;
  testGroupId: string;
  testId: string;
  testName: string;
}

interface SDKAssignment {
  assignmentData: ExperimentAssignmentData;
  experimentData: ExperimentData | null;
}

interface UseAssignmentResponse {
  assignment: SDKAssignment | null;
  asyncStatus: 'LOADING' | 'SUCCESS' | 'ERROR';
  error?: Error;
}

interface BasicAPICallingFunctionOptions {
  timeoutMs?: number;
  team?: string;
}

type UseAssignmentHookFn = (
  experimentName: string,
  trackIsInSample: boolean,
  options?: BasicAPICallingFunctionOptions
) => UseAssignmentResponse;

type AssignExperimentFn = (
  experimentName: string,
  options?: BasicAPICallingFunctionOptions
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
        asyncStatus: 'SUCCESS' as const,
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
  const contextValue = useMemo(
    () => ({ useAssignment, assignExperiment }),
    [useAssignment, assignExperiment]
  );

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
