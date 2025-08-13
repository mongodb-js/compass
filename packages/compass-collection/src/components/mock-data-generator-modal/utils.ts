import { MockDataGeneratorStep } from './types';

export const getNextStep = (
  currentStep: MockDataGeneratorStep
): MockDataGeneratorStep => {
  switch (currentStep) {
    case MockDataGeneratorStep.AI_DISCLAIMER:
      return MockDataGeneratorStep.SCHEMA_CONFIRMATION;
    case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
      return MockDataGeneratorStep.SCHEMA_EDITOR;
    case MockDataGeneratorStep.SCHEMA_EDITOR:
      return MockDataGeneratorStep.DOCUMENT_COUNT;
    case MockDataGeneratorStep.DOCUMENT_COUNT:
      return MockDataGeneratorStep.PREVIEW_DATA;
    case MockDataGeneratorStep.PREVIEW_DATA:
      return MockDataGeneratorStep.GENERATE_DATA;
    case MockDataGeneratorStep.GENERATE_DATA:
      // No next step after data generation
      return currentStep;
  }
};

export const getPreviousStep = (
  currentStep: MockDataGeneratorStep
): MockDataGeneratorStep => {
  switch (currentStep) {
    case MockDataGeneratorStep.AI_DISCLAIMER:
      // No previous step from AI disclaimer
      return currentStep;
    case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
      return MockDataGeneratorStep.AI_DISCLAIMER;
    case MockDataGeneratorStep.SCHEMA_EDITOR:
      return MockDataGeneratorStep.SCHEMA_CONFIRMATION;
    case MockDataGeneratorStep.DOCUMENT_COUNT:
      return MockDataGeneratorStep.SCHEMA_EDITOR;
    case MockDataGeneratorStep.PREVIEW_DATA:
      return MockDataGeneratorStep.DOCUMENT_COUNT;
    case MockDataGeneratorStep.GENERATE_DATA:
      return MockDataGeneratorStep.PREVIEW_DATA;
  }
};
