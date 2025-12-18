import { expect } from 'chai';
import { buildExplainPlanPrompt, buildContextPrompt } from './prompts';

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

      expect(queryPrompt.metadata?.instructions).to.include('MongoDB Query');
      expect(queryPrompt.metadata?.instructions).to.not.include(
        'MongoDB Aggregation Pipeline'
      );

      expect(aggregationPrompt.metadata?.instructions).to.include(
        'MongoDB Aggregation Pipeline'
      );
      expect(aggregationPrompt.metadata?.instructions).to.not.include(
        'MongoDB Query'
      );
    });
  });

  describe('buildContextPrompt', function () {
    const testCases: {
      context: Parameters<typeof buildContextPrompt>[0];
      expected: string;
    }[] = [
      // No active tab
      {
        context: {
          activeWorkspace: null,
          activeConnection: null,
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
        },
        expected: 'The user does not have any tabs open.',
      },
      // Welcome
      {
        context: {
          activeWorkspace: {
            id: 'welcome-tab-1',
            type: 'Welcome',
          },
          activeConnection: null,
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
        },
        expected: 'The user is on the "Welcome" tab.',
      },
      // My Queries
      {
        context: {
          activeWorkspace: {
            id: 'my-queries-tab-1',
            type: 'My Queries',
          },
          activeConnection: null,
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
        },
        expected: 'The user is on the "My Queries" tab.',
      },
      // Data Modeling
      {
        context: {
          activeWorkspace: {
            id: 'data-modelling-tab-1',
            type: 'Data Modeling',
          },
          activeConnection: null,
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
        },
        expected: 'The user is on the "Data Modeling" tab.',
      },
      // Databases
      {
        context: {
          activeWorkspace: {
            id: 'databases-tab-1',
            type: 'Databases',
            connectionId: 'conn-1',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Databases" tab.',
      },
      // Performance
      {
        context: {
          activeWorkspace: {
            id: 'performance-tab-1',
            type: 'Performance',
            connectionId: 'conn-1',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Performance" tab.',
      },
      // Shell
      {
        context: {
          activeWorkspace: {
            id: 'shell-tab-1',
            type: 'Shell',
            connectionId: 'conn-1',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Shell" tab.',
      },
      // Collections
      {
        context: {
          activeWorkspace: {
            id: 'collections-tab-1',
            type: 'Collections',
            connectionId: 'conn-1',
            namespace: 'test',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Collections" tab for the "test" namespace.',
      },
      // Normal Collection
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.normal',
            subTab: 'Schema',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
          },
          activeCollectionSubTab: 'Schema',
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Schema" tab for the "test.normal" namespace.',
      },
      // Timeseries Collection
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.timeseries',
            subTab: 'Aggregations',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: true,
          },
          activeCollectionSubTab: 'Aggregations',
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Aggregations" tab for the "test.timeseries" namespace. "test.timeseries" is a time-series collection.',
      },
      // View Collection
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.view',
            subTab: 'Documents',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
            sourceName: 'test.normal',
          },
          activeCollectionSubTab: 'Documents',
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Documents" tab for the "test.view" namespace. "test.view" is a view on the "test.normal" collection.',
      },
    ];

    for (const testCase of testCases) {
      const summary: {
        type: string;
        isTimeSeries?: boolean;
        isView?: boolean;
        subTab?: string;
      } = {
        type: testCase.context.activeWorkspace?.type || 'No active tab',
      };
      if (testCase.context.activeCollectionMetadata?.isTimeSeries) {
        summary.isTimeSeries = true;
      }
      if (testCase.context.activeCollectionMetadata?.sourceName) {
        summary.isView = true;
      }
      if (hasSubtab(testCase.context.activeWorkspace)) {
        summary.subTab = testCase.context.activeWorkspace.subTab;
      }
      const summaryString = Object.entries(summary)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      it(`renders the expected prompt for ${summaryString}`, function () {
        const result = buildContextPrompt(testCase.context);
        expect(result.id).to.match(/^system-context-/);
        expect(result.metadata?.isSystemContext).to.equal(true);
        expect(result.role).to.equal('system');
        expect(result.parts).to.have.lengthOf(1);
        const text = hasText(result.parts[0]) ? result.parts[0].text : '';
        expect(text).equal(testCase.expected);
      });
    }
  });
});

function hasSubtab(obj: unknown): obj is { subTab: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'subTab' in obj &&
    typeof (obj as any).subTab === 'string'
  );
}

function hasText(obj: unknown): obj is { text: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'text' in obj &&
    typeof (obj as any).text === 'string'
  );
}
