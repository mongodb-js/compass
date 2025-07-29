import React, { createContext, useContext, useRef } from 'react';

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

interface ExperimentationProviderContextValue {
  useAssignment: UseAssignmentHookFn;
  assignExperiment: AssignExperimentFn;
}

const ExperimentationContext =
  createContext<ExperimentationProviderContextValue>({
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
export const ExperimentationProvider: React.FC<{
  children: React.ReactNode;
  useAssignment: UseAssignmentHookFn;
  assignExperiment: AssignExperimentFn;
}> = ({ children, useAssignment, assignExperiment }) => {
  const contextValue = useRef({ useAssignment, assignExperiment });

  return (
    <ExperimentationContext.Provider value={contextValue.current}>
      {children}
    </ExperimentationContext.Provider>
  );
};

// Hook for components to access experiment assignment
export const useAssignment = (...args: Parameters<UseAssignmentHookFn>) => {
  return useContext(ExperimentationContext).useAssignment(...args);
};
