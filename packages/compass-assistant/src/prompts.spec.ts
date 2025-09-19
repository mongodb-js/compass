import { expect } from 'chai';
import { buildExplainPlanPrompt } from './prompts';

describe('prompts', function () {
  describe('buildExplainPlanPrompt', function () {
    const mockExplainPlan = JSON.stringify({
      stages: [{ stage: 'COLLSCAN', executionTimeMillisEstimate: 100 }],
      executionStats: { executionTimeMillis: 150 },
    });

    it('should distinguish between query and aggregation in the prompt', function () {
      const queryPrompt = buildExplainPlanPrompt({
        explainPlan: mockExplainPlan,
        operationType: 'query',
      });

      const aggregationPrompt = buildExplainPlanPrompt({
        explainPlan: mockExplainPlan,
        operationType: 'aggregation',
      });

      expect(queryPrompt.prompt).to.include('MongoDB Query');
      expect(queryPrompt.prompt).to.not.include('MongoDB Aggregation Pipeline');

      expect(aggregationPrompt.prompt).to.include(
        'MongoDB Aggregation Pipeline'
      );
      expect(aggregationPrompt.prompt).to.not.include('MongoDB Query');
    });
  });
});
