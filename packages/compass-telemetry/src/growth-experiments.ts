export const ExperimentTestNames = {
  mockDataGenerator: 'MOCK_DATA_GENERATOR_ITERATION_20260507',
  searchActivationProgramP1: 'SEARCH_ACTIVATION_PROGRAM_P1_20260427',
  searchActivationProgramP2: 'SEARCH_ACTIVATION_PROGRAM_P2_20260609',
} as const;

export type ExperimentTestName =
  (typeof ExperimentTestNames)[keyof typeof ExperimentTestNames];

export const ExperimentTestGroups = {
  mockDataGeneratorVariant: 'mockDataGeneratorVariant',
  mockDataGeneratorControl: 'mockDataGeneratorControl',
  searchActivationProgramP1Variant: 'searchActivationProgramP1Variant',
  searchActivationProgramP1Control: 'searchActivationProgramP1Control',
  searchActivationProgramP2Variant: 'searchActivationProgramP2Variant',
  searchActivationProgramP2Control: 'searchActivationProgramP2Control',
} as const;

export type ExperimentTestGroup =
  (typeof ExperimentTestGroups)[keyof typeof ExperimentTestGroups];
