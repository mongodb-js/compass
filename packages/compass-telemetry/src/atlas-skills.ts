import { ExperimentTestGroup, ExperimentTestName } from './growth-experiments';
import { useAssignment, useTrackInSample } from './experimentation-provider';

// @ts-expect-error TODO(COMPASS-10124): replace enums with const kv objects
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

  // Track users who are assigned to the skills experiment (variant or control)
  useTrackInSample(ExperimentTestName.atlasSkills, !!atlasSkillsAssignment, {
    screen: context,
  });

  return {
    shouldShowAtlasSkillsBanner: isInSkillsVariant,
  };
};
