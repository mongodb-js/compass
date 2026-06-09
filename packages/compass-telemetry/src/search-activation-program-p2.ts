import {
  ExperimentTestGroups,
  ExperimentTestNames,
} from './growth-experiments';
import { useAssignment } from './experimentation-provider';

// @experiment Search Activation Program P2 | Jira Epic: CLOUDP-331931
export const useSearchActivationProgramP2 = () => {
  const assignment = useAssignment(
    ExperimentTestNames.searchActivationProgramP2,
    true
  );

  const isInVariant =
    assignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroups.searchActivationProgramP2Variant;

  return { enableSearchActivationProgramP2: isInVariant };
};
