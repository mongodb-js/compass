import {
  ExperimentTestGroups,
  ExperimentTestNames,
} from './growth-experiments';
import { useAssignment, useTrackInSample } from './experimentation-provider';

export const SkillsBannerContexts = {
  Documents: 'documents',
  Aggregation: 'aggregation',
  Indexes: 'indexes',
  Schema: 'schema',
} as const;

type SkillsBannerContext =
  (typeof SkillsBannerContexts)[keyof typeof SkillsBannerContexts];

// @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
export const useAtlasSkillsBanner = (context: SkillsBannerContext) => {
  const atlasSkillsAssignment = useAssignment(
    ExperimentTestNames.atlasSkills,
    false
  );

  const isInSkillsVariant =
    atlasSkillsAssignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroups.atlasSkillsVariant;

  // Track users who are assigned to the skills experiment (variant or control)
  useTrackInSample(ExperimentTestNames.atlasSkills, !!atlasSkillsAssignment, {
    screen: context,
  });

  return {
    shouldShowAtlasSkillsBanner: isInSkillsVariant,
  };
};
