import React, { createContext, useRef } from 'react';
import type { types } from '@mongodb-js/mdb-experiment-js';
import type { ExperimentTestName } from './growth-experiments';

type AssignExperimentFn = (
  experimentName: ExperimentTestName,
  options?: types.AssignOptions<string>
) => Promise<types.AsyncStatus | null>;

type GetAssignmentFn = (
  experimentName: ExperimentTestName,
  trackIsInSample: boolean,
  options?: types.GetAssignmentOptions<types.TypeData>
) => Promise<types.SDKAssignment<ExperimentTestName, string> | null>;

interface CompassExperimentationProviderContextValue {
  assignExperiment: AssignExperimentFn;
  getAssignment: GetAssignmentFn;
}

const initialContext: CompassExperimentationProviderContextValue = {
  assignExperiment() {
    return Promise.resolve(null);
  },
  getAssignment() {
    return Promise.resolve(null);
  },
};

export const ExperimentationContext =
  createContext<CompassExperimentationProviderContextValue>(initialContext);

// Provider component that accepts MMS experiment utils as props
export const CompassExperimentationProvider: React.FC<{
  children: React.ReactNode;
  assignExperiment: AssignExperimentFn;
  getAssignment: GetAssignmentFn;
}> = ({ children, assignExperiment, getAssignment }) => {
  // Use useRef to keep the functions up-to-date; Use mutation pattern to maintain the
  // same object reference to prevent unnecessary re-renders of consuming components
  const { current: contextValue } = useRef({
    assignExperiment,
    getAssignment,
  });
  contextValue.assignExperiment = assignExperiment;
  contextValue.getAssignment = getAssignment;

  return (
    <ExperimentationContext.Provider value={contextValue}>
      {children}
    </ExperimentationContext.Provider>
  );
};
