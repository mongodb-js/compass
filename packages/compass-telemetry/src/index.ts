export { createIpcTrack, createIpcSendTrack } from './ipc-track';
export type { TelemetryServiceOptions } from './generic-track';
export type {
  TrackFunction,
  IdentifyTraits,
  ExtraConnectionData,
} from './types';

export { CompassExperimentationProvider } from './experimentation-provider';
export {
  ExperimentTestNames,
  type ExperimentTestName,
  ExperimentTestGroups,
  type ExperimentTestGroup,
} from './growth-experiments';

// @experiment Search Activation Program P1  | Jira Epic: CLOUDP-308952
export { useSearchActivationProgramP1 } from './search-activation-program-p1';
