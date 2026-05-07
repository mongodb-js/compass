import {
  ExperimentTestGroups,
  ExperimentTestNames,
} from './growth-experiments';
import { useAssignment } from './experimentation-provider';

// @experiment Search Activation Program P1  | Jira Epic: CLOUDP-308952
export const useSearchActivationProgramP1 = () => {
  const assignment = useAssignment(
    ExperimentTestNames.searchActivationProgramP1,
    true
  );

  const isInVariant =
    assignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroups.searchActivationProgramP1Variant;

  return {
    enableSearchActivationProgramP1: isInVariant,
  };
};
