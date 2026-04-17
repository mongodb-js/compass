import { Eval } from 'braintrust';

import { generateSchemaForEval } from './mock-data-api';
import {
  FakerFieldNameAccuracy,
  FakerMethodSuggestionAccuracy,
  PercentRecognizedScorer,
  FakerArgParseableScorer,
  MethodRunnableScorer,
} from './mock-data-scorers';
import { mockDataEvalCases } from './use-cases/mock-data-schema';
import type {
  MockDataGeneratorEvalInput,
  MockDataGeneratorEvalOutput,
  MockDataGeneratorExpected,
  MockDataGeneratorMetadata,
} from './types';

const MAX_CONCURRENCY = 3;
const TRIAL_COUNT = 3;

function createMockDataGeneratorEval() {
  return Eval<
    MockDataGeneratorEvalInput,
    MockDataGeneratorEvalOutput,
    MockDataGeneratorExpected,
    MockDataGeneratorMetadata
  >('compass-mock-data-generator', {
    data: mockDataEvalCases.map((evalCase) => ({
      input: {
        providedSchema: evalCase.providedSchema,
      },
      expected: {
        response: evalCase.expectedResponse,
      },
      metadata: evalCase.metadata,
    })),
    task: async (input) => {
      try {
        const response = await generateSchemaForEval(input.providedSchema);

        return {
          response,
        };
      } catch {
        return {
          response: {
            errorType: 'UNEXPECTED_EVAL_ERROR' as const,
            fields: [],
          },
        };
      }
    },
    scores: [
      FakerFieldNameAccuracy,
      FakerMethodSuggestionAccuracy,
      PercentRecognizedScorer,
      FakerArgParseableScorer,
      MethodRunnableScorer,
    ],
    trialCount: TRIAL_COUNT,
    maxConcurrency: MAX_CONCURRENCY,
  });
}

void createMockDataGeneratorEval();
