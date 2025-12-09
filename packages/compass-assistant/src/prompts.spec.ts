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
          currentWorkspace: null,
          currentActiveConnection: null,
          currentWorkspaceCollectionInfo: null,
        },
        expected: 'The user does not have any tabs open.',
      },
      // Welcome
      {
        context: {
          currentWorkspace: {
            id: 'welcome-tab-1',
            type: 'Welcome',
          },
          currentActiveConnection: null,
          currentWorkspaceCollectionInfo: null,
        },
        expected: 'The user is on the "Welcome" tab.',
      },
      // My Queries
      {
        context: {
          currentWorkspace: {
            id: 'my-queries-tab-1',
            type: 'My Queries',
          },
          currentActiveConnection: null,
          currentWorkspaceCollectionInfo: null,
        },
        expected: 'The user is on the "My Queries" tab.',
      },
      // Data Modeling
      {
        context: {
          currentWorkspace: {
            id: 'data-modelling-tab-1',
            type: 'Data Modeling',
          },
          currentActiveConnection: null,
          currentWorkspaceCollectionInfo: null,
        },
        expected: 'The user is on the "Data Modeling" tab.',
      },
      // Databases
      {
        context: {
          currentWorkspace: {
            id: 'databases-tab-1',
            type: 'Databases',
            connectionId: 'conn-1',
          },
          currentActiveConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          currentWorkspaceCollectionInfo: null,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Databases" tab.',
      },
      // Performance
      {
        context: {
          currentWorkspace: {
            id: 'performance-tab-1',
            type: 'Performance',
            connectionId: 'conn-1',
          },
          currentActiveConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          currentWorkspaceCollectionInfo: null,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Performance" tab.',
      },
      // Shell
      {
        context: {
          currentWorkspace: {
            id: 'shell-tab-1',
            type: 'Shell',
            connectionId: 'conn-1',
          },
          currentActiveConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          currentWorkspaceCollectionInfo: null,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Shell" tab.',
      },
      // Collections
      {
        context: {
          currentWorkspace: {
            id: 'collections-tab-1',
            type: 'Collections',
            connectionId: 'conn-1',
            namespace: 'test',
          },
          currentActiveConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          currentWorkspaceCollectionInfo: null,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Collections" tab for the "test" namespace.',
      },
      // Normal Collection
      {
        context: {
          currentWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.normal',
            subTab: 'Schema',
          },
          currentActiveConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          currentWorkspaceCollectionInfo: {
            isTimeSeries: false,
          },
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Schema" tab for the "test.normal" namespace.',
      },
      // Timeseries Collection
      {
        context: {
          currentWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.timeseries',
            subTab: 'Aggregations',
          },
          currentActiveConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          currentWorkspaceCollectionInfo: {
            isTimeSeries: true,
          },
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Aggregations" tab for the "test.timeseries" namespace. "test.timeseries" is a time-series collection.',
      },
      // View Collection
      {
        context: {
          currentWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.view',
            subTab: 'Documents',
          },
          currentActiveConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          currentWorkspaceCollectionInfo: {
            isTimeSeries: false,
            sourceName: 'test.normal',
          },
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Documents" tab for the "test.view" namespace. "test.view" is a view on the "test.normal" collection.',
      },
    ];

    for (const testCase of testCases) {
      const summary: Record<string, string | boolean> = {
        type: testCase.context.currentWorkspace?.type || 'No active tab',
      };
      if (testCase.context.currentWorkspaceCollectionInfo?.isTimeSeries) {
        summary.isTimeSeries = true;
      }
      if (testCase.context.currentWorkspaceCollectionInfo?.sourceName) {
        summary.isView = true;
      }
      if ((testCase.context.currentWorkspace as any)?.subTab) {
        summary.subTab = (testCase.context.currentWorkspace as any).subTab;
      }
      const summaryString = Object.entries(summary)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      it(`renders the expected prompt for ${summaryString}`, function () {
        const result = buildContextPrompt(testCase.context);
        expect(result.id).to.match(/^system-context-/);
        expect(result.role).to.equal('system');
        expect(result.parts).to.have.lengthOf(1);
        const text = (result.parts[0] as any).text;
        expect(text).equal(testCase.expected);
      });
    }
  });
});
