// @ts-expect-error TODO(COMPASS-10124): replace enums with const kv objects
export enum ExperimentTestName {
  mockDataGenerator = 'MOCK_DATA_GENERATOR_20251001',
  atlasSkills = 'ATLAS_SKILLS_EXPERIMENT_20251007',
}

// @ts-expect-error TODO(COMPASS-10124): replace enums with const kv objects
export enum ExperimentTestGroup {
  mockDataGeneratorVariant = 'mockDataGeneratorVariant',
  mockDataGeneratorControl = 'mockDataGeneratorControl',
  atlasSkillsVariant = 'atlasSkillsExperimentVariant',
  atlasSkillsControl = 'atlasSkillsExperimentControl',
}
