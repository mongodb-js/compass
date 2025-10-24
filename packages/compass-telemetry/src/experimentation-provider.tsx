import React, { createContext, useContext, useRef } from 'react';
import type { types } from '@mongodb-js/mdb-experiment-js';
import type { typesReact } from '@mongodb-js/mdb-experiment-js/react';
import type { ExperimentTestName } from './growth-experiments';

type UseAssignmentHook = (
  experimentName: ExperimentTestName,
  trackIsInSample: boolean,
  options?: typesReact.UseAssignmentOptions<types.TypeData>
) => typesReact.UseAssignmentResponse<types.TypeData>;

type AssignExperimentFn = (
  experimentName: ExperimentTestName,
  options?: types.AssignOptions<string>
) => Promise<types.AsyncStatus | null>;

type GetAssignmentFn = (
  experimentName: ExperimentTestName,
  trackIsInSample: boolean,
  options?: types.GetAssignmentOptions<types.TypeData>
) => Promise<types.SDKAssignment<ExperimentTestName, string> | null>;

type UseTrackInSampleHook = (
  experimentName: ExperimentTestName,
  shouldFireEvent?: boolean,
  customProperties?: types.TypeData['experimentViewedProps'],
  team?: types.TypeData['loggerTeam']
) => typesReact.BasicHookResponse;

interface CompassExperimentationProviderContextValue {
  useAssignment: UseAssignmentHook;
  assignExperiment: AssignExperimentFn;
  getAssignment: GetAssignmentFn;
  useTrackInSample: UseTrackInSampleHook;
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
  getAssignment() {
    return Promise.resolve(null);
  },
  useTrackInSample() {
    return {
      asyncStatus: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
    };
  },
};

export const ExperimentationContext =
  createContext<CompassExperimentationProviderContextValue>(initialContext);

// Provider component that accepts MMS experiment utils as props
export const CompassExperimentationProvider: React.FC<{
  children: React.ReactNode;
  useAssignment: UseAssignmentHook;
  assignExperiment: AssignExperimentFn;
  getAssignment: GetAssignmentFn;
  useTrackInSample: UseTrackInSampleHook;
}> = ({
  children,
  useAssignment,
  assignExperiment,
  getAssignment,
  useTrackInSample,
}) => {
  // Use useRef to keep the functions up-to-date; Use mutation pattern to maintain the
  // same object reference to prevent unnecessary re-renders of consuming components
  const { current: contextValue } = useRef({
    useAssignment,
    assignExperiment,
    getAssignment,
    useTrackInSample,
  });
  contextValue.useAssignment = useAssignment;
  contextValue.assignExperiment = assignExperiment;
  contextValue.getAssignment = getAssignment;
  contextValue.useTrackInSample = useTrackInSample;

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

// Hook for components to access experiment assignment
export const useTrackInSample = (...args: Parameters<UseTrackInSampleHook>) => {
  return useContext(ExperimentationContext).useTrackInSample(...args);
};
