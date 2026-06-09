import {
  ExperimentTestGroups,
  ExperimentTestNames,
} from './growth-experiments';
import { useAssignment } from './experimentation-provider';

// @experiment Search Contextual AI Assistant Entry | Jira Epic: CLOUDP-411692
export const useSearchContextualAiAssistantEntry = () => {
  const assignment = useAssignment(
    ExperimentTestNames.searchContextualAiAssistantEntry,
    true
  );

  const isInVariant =
    assignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroups.searchContextualAiAssistantEntryVariant;

  return { enableSearchContextualAiAssistantEntry: isInVariant };
};
