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
          enableToolCalling: false,
        },
        expected:
          "The user does not have any tabs open.\n\nYou cannot access the user's current query or aggregation pipeline.",
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
          enableToolCalling: false,
        },
        expected:
          'The user is on the "Welcome" tab.\n\nYou cannot access the user\'s current query or aggregation pipeline.',
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
          enableToolCalling: false,
        },
        expected:
          'The user is on the "My Queries" tab.\n\nYou cannot access the user\'s current query or aggregation pipeline.',
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
          enableToolCalling: false,
        },
        expected:
          'The user is on the "Data Modeling" tab.\n\nYou cannot access the user\'s current query or aggregation pipeline.',
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
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Databases" tab.\n\nYou cannot access the user\'s current query or aggregation pipeline.',
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
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Performance" tab.\n\nYou cannot access the user\'s current query or aggregation pipeline.',
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
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Shell" tab.\n\nYou cannot access the user\'s current query or aggregation pipeline.',
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
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Collections" tab for the "test" namespace.\n\nYou cannot access the user\'s current query or aggregation pipeline.',
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
            isClustered: false,
            isFLE: false,
            isSearchIndexesSupported: false,
            isDataLake: false,
            isAtlas: false,
            serverVersion: '7.0.0',
          },
          activeCollectionSubTab: 'Schema',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Schema" tab for the "test.normal" namespace. "test.normal" does not support Atlas Search indexes. Server version: 7.0.0\n\nYou cannot access the user\'s current query or aggregation pipeline.',
      },
      // Collection, Documents tab with enableToolCalling=true
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.normal',
            subTab: 'Documents',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
            isClustered: false,
            isFLE: false,
            isSearchIndexesSupported: false,
            isDataLake: false,
            isAtlas: false,
            serverVersion: '7.0.0',
          },
          activeCollectionSubTab: 'Documents',
          enableToolCalling: true,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Documents" tab for the "test.normal" namespace. "test.normal" does not support Atlas Search indexes. Server version: 7.0.0\n\nUse the "get-compass-context" tool to get the current query from the query bar.',
      },
      // Collection, Aggregations tab with enableToolCalling=true
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.normal',
            subTab: 'Aggregations',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
            isClustered: false,
            isFLE: false,
            isSearchIndexesSupported: false,
            isDataLake: false,
            isAtlas: false,
            serverVersion: '7.0.0',
          },
          activeCollectionSubTab: 'Aggregations',
          enableToolCalling: true,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Aggregations" tab for the "test.normal" namespace. "test.normal" does not support Atlas Search indexes. Server version: 7.0.0\n\nUse the "get-compass-context" tool to get the current aggregation pipeline from the aggregation builder.',
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
            isClustered: false,
            isFLE: false,
            isSearchIndexesSupported: false,
            isDataLake: false,
            isAtlas: false,
            serverVersion: '',
          },
          activeCollectionSubTab: 'Aggregations',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Aggregations" tab for the "test.timeseries" namespace. "test.timeseries" is a time-series collection, does not support Atlas Search indexes. Server version: \n\nYou cannot access the user\'s current query or aggregation pipeline.',
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
            isClustered: false,
            isFLE: false,
            isSearchIndexesSupported: false,
            isDataLake: false,
            isAtlas: false,
            serverVersion: '7.0.0',
          },
          activeCollectionSubTab: 'Documents',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Documents" tab for the "test.view" namespace. "test.view" is a view on the "test.normal" collection, does not support Atlas Search indexes. Server version: 7.0.0\n\nYou cannot access the user\'s current query or aggregation pipeline.',
      },
      // Clustered Collection
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.clustered',
            subTab: 'Schema',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
            isClustered: true,
            isFLE: false,
            isSearchIndexesSupported: false,
            isDataLake: false,
            isAtlas: false,
            serverVersion: '7.0.0',
          },
          activeCollectionSubTab: 'Schema',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Schema" tab for the "test.clustered" namespace. "test.clustered" is a clustered collection, does not support Atlas Search indexes. Server version: 7.0.0\n\nYou cannot access the user\'s current query or aggregation pipeline.',
      },
      // FLE Collection
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.encrypted',
            subTab: 'Documents',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
            isClustered: false,
            isFLE: true,
            isSearchIndexesSupported: false,
            isDataLake: false,
            isAtlas: false,
            serverVersion: '7.0.0',
          },
          activeCollectionSubTab: 'Documents',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Documents" tab for the "test.encrypted" namespace. "test.encrypted" has encrypted fields, does not support Atlas Search indexes. Server version: 7.0.0\n\nYou cannot access the user\'s current query or aggregation pipeline.',
      },
      // Collection with Search Indexes Support
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.searchable',
            subTab: 'Indexes',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb+srv://cluster.mongodb.net',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
            isClustered: false,
            isFLE: false,
            isSearchIndexesSupported: true,
            isDataLake: false,
            isAtlas: true,
            serverVersion: '7.0.0',
          },
          activeCollectionSubTab: 'Indexes',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "cluster.mongodb.net". The redacted connection string is "mongodb+srv://cluster.mongodb.net/".\n\nThe user is on the "Indexes" tab for the "test.searchable" namespace. "test.searchable" supports Atlas Search indexes. The instance is Atlas. Server version: 7.0.0\n\nYou cannot access the user\'s current query or aggregation pipeline.',
      },
      // Data Lake Collection
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.datalake',
            subTab: 'Documents',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb+srv://datalake.mongodb.net',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
            isClustered: false,
            isFLE: false,
            isSearchIndexesSupported: false,
            isDataLake: true,
            isAtlas: true,
            serverVersion: '6.0.0',
          },
          activeCollectionSubTab: 'Documents',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "datalake.mongodb.net". The redacted connection string is "mongodb+srv://datalake.mongodb.net/".\n\nThe user is on the "Documents" tab for the "test.datalake" namespace. "test.datalake" does not support Atlas Search indexes. The instance is Data Lake and Atlas. Server version: 6.0.0\n\nYou cannot access the user\'s current query or aggregation pipeline.',
      },
      // Collection with multiple features
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.multifeature',
            subTab: 'Aggregations',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb+srv://cluster.mongodb.net',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: true,
            isClustered: true,
            isFLE: true,
            isSearchIndexesSupported: true,
            isDataLake: false,
            isAtlas: true,
            serverVersion: '8.0.0',
          },
          activeCollectionSubTab: 'Aggregations',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "cluster.mongodb.net". The redacted connection string is "mongodb+srv://cluster.mongodb.net/".\n\nThe user is on the "Aggregations" tab for the "test.multifeature" namespace. "test.multifeature" is a time-series collection, is a clustered collection, has encrypted fields, supports Atlas Search indexes. The instance is Atlas. Server version: 8.0.0\n\nYou cannot access the user\'s current query or aggregation pipeline.',
      },
      // Collection without server version
      {
        context: {
          activeWorkspace: {
            id: 'collection-tab-1',
            type: 'Collection',
            connectionId: 'conn-1',
            namespace: 'test.noversion',
            subTab: 'Documents',
          },
          activeConnection: {
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
          activeCollectionMetadata: {
            isTimeSeries: false,
            isClustered: false,
            isFLE: false,
            isSearchIndexesSupported: false,
            isDataLake: false,
            isAtlas: false,
            serverVersion: '7.0.0',
          },
          activeCollectionSubTab: 'Documents',
          enableToolCalling: false,
        },
        expected:
          'The connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/".\n\nThe user is on the "Documents" tab for the "test.noversion" namespace. "test.noversion" does not support Atlas Search indexes. Server version: 7.0.0\n\nYou cannot access the user\'s current query or aggregation pipeline.',
      },
    ];

    for (const testCase of testCases) {
      const summary: Record<string, string | boolean> = {
        type: testCase.context.activeWorkspace?.type || 'No active tab',
      };
      if (testCase.context.activeCollectionMetadata?.isTimeSeries) {
        summary.isTimeSeries = true;
      }
      if (testCase.context.activeCollectionMetadata?.sourceName) {
        summary.isView = true;
      }
      if (testCase.context.activeCollectionMetadata?.isClustered) {
        summary.isClustered = true;
      }
      if (testCase.context.activeCollectionMetadata?.isFLE) {
        summary.isFLE = true;
      }
      if (testCase.context.activeCollectionMetadata?.isSearchIndexesSupported) {
        summary.isSearchIndexesSupported = true;
      }
      if (testCase.context.activeCollectionMetadata?.isDataLake) {
        summary.isDataLake = true;
      }
      if (testCase.context.activeCollectionMetadata?.isAtlas) {
        summary.isAtlas = true;
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
