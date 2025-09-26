import { MockDataGeneratorStep } from './types';

export const StepButtonLabelMap = {
  [MockDataGeneratorStep.SCHEMA_CONFIRMATION]: 'Confirm',
  [MockDataGeneratorStep.SCHEMA_EDITOR]: 'Next',
  [MockDataGeneratorStep.DOCUMENT_COUNT]: 'Next',
  [MockDataGeneratorStep.PREVIEW_DATA]: 'Generate Script',
  [MockDataGeneratorStep.GENERATE_DATA]: 'Done',
} as const;

export const DEFAULT_DOCUMENT_COUNT = 1000;
export const MAX_DOCUMENT_COUNT = 100000;
