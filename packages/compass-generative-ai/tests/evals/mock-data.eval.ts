import { Eval } from 'braintrust';
import type {
  MockDataEvalCaseInput,
  MockDataTaskOutput,
  MockDataEvalCaseExpected,
} from './types';
import { makeMockDataCall } from './mock-data-api';
import {
  FieldCoverage,
  FakerMethodValidity,
  FakerMethodRelevance,
} from './mock-data-scorers';
import { generateMockDataEvalCases } from './use-cases/mock-data-schema';

const MOCK_DATA_PROJECT_NAME = 'compass-mock-data-generator';

void Eval<MockDataEvalCaseInput, MockDataTaskOutput, MockDataEvalCaseExpected>(
  MOCK_DATA_PROJECT_NAME,
  {
    data: () => {
      return generateMockDataEvalCases();
    },
    task: makeMockDataCall,
    scores: [FieldCoverage, FakerMethodValidity, FakerMethodRelevance],
  }
);
