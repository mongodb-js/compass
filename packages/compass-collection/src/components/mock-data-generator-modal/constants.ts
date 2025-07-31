import { MockDataGeneratorStep } from './types';

export const StepButtonLabelMap = {
  [MockDataGeneratorStep.AI_DISCLAIMER]: 'Use Natural Language',
  [MockDataGeneratorStep.SCHEMA_CONFIRMATION]: 'Confirm',
  [MockDataGeneratorStep.SCHEMA_EDITOR]: 'Next',
  [MockDataGeneratorStep.DOCUMENT_COUNT]: 'Next',
  [MockDataGeneratorStep.PREVIEW_DATA]: 'Generate Script',
  [MockDataGeneratorStep.GENERATE_DATA]: 'Done',
} as const;
