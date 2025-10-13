import {
  ExperimentTestGroup,
  ExperimentTestName,
  useAssignment,
} from './provider';
import { useTrackInSample } from './experimentation-provider';

export enum SkillsBannerContextEnum {
  Documents = 'documents',
  Aggregation = 'aggregation',
  Indexes = 'indexes',
  Schema = 'schema',
}

// @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
export const useAtlasSkillsBanner = (context: SkillsBannerContextEnum) => {
  const atlasSkillsAssignment = useAssignment(
    ExperimentTestName.atlasSkills,
    false
  );

  const isInSkillsVariant =
    atlasSkillsAssignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroup.atlasSkillsVariant;

  // Track experiment viewed when user is in experiment and banner would be shown
  useTrackInSample(ExperimentTestName.atlasSkills, !!atlasSkillsAssignment, {
    screen: context,
  });

  return {
    shouldShowAtlasSkillsBanner: isInSkillsVariant,
  };
};
