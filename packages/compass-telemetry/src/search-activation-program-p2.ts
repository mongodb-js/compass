import {
  ExperimentTestGroups,
  ExperimentTestNames,
} from './growth-experiments';
import { useAssignment } from './experimentation-provider';

// @experiment Search Activation Program P2 | Jira Epic: CLOUDP-331931
// trackIsInSample controls whether this call fires an "Experiment Viewed" tracking event.
export const useSearchActivationProgramP2 = ({
  trackIsInSample,
}: {
  trackIsInSample: boolean;
}) => {
  const assignment = useAssignment(
    ExperimentTestNames.searchActivationProgramP2,
    trackIsInSample
  );

  const isInVariant =
    assignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroups.searchActivationProgramP2Variant;

  // A null asyncStatus indicates the assignment has not yet resolved and must be treated as loading.
  const isLoading =
    !assignment.asyncStatus || assignment.asyncStatus === 'LOADING';

  return {
    enableSearchActivationProgramP2: isInVariant,
    isSearchActivationProgramP2Loading: isLoading,
  };
};
