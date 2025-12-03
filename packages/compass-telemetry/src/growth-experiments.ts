export const ExperimentTestNames = {
  mockDataGenerator: 'MOCK_DATA_GENERATOR_20251001',
  atlasSkills: 'ATLAS_SKILLS_EXPERIMENT_20251007',
} as const;

export type ExperimentTestName =
  (typeof ExperimentTestNames)[keyof typeof ExperimentTestNames];

export const ExperimentTestGroups = {
  mockDataGeneratorVariant: 'mockDataGeneratorVariant',
  mockDataGeneratorControl: 'mockDataGeneratorControl',
  atlasSkillsVariant: 'atlasSkillsExperimentVariant',
  atlasSkillsControl: 'atlasSkillsExperimentControl',
} as const;

export type ExperimentTestGroup =
  (typeof ExperimentTestGroups)[keyof typeof ExperimentTestGroups];
