import { MockDataGeneratorStep } from './types';

export const getNextStepButtonLabel = (step: MockDataGeneratorStep): string => {
  switch (step) {
    case MockDataGeneratorStep.AI_DISCLAIMER:
      return 'Use Natural Language';
    case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
      return 'Confirm';
    case MockDataGeneratorStep.SCHEMA_EDITOR:
    case MockDataGeneratorStep.DOCUMENT_COUNT:
      return 'Next';
    case MockDataGeneratorStep.PREVIEW_DATA:
      return 'Generate Script';
    case MockDataGeneratorStep.GENERATE_DATA:
      return 'Done';
    default:
      return 'Next';
  }
};
