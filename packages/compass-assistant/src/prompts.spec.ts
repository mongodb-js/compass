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
    const noConnectionInstructions = `
<instructions>
Database tool calls require a focused connection. Tell the user to navigate to a connection if they try to use any of these tools:
- find: Retrieves specific documents that match your search criteria.
- aggregate: Performs complex data processing, grouping, and calculations.
- count: Quickly returns the total number of documents matching a query.
- list-databases: Displays all available databases in the connected cluster.
- list-collections: Shows all collections within a specified database.
- collection-schema: Describes the schema structure of a collection.
- collection-indexes: Lists all indexes defined on a collection.
- collection-storage-size: Returns the storage size information for a collection.
- db-stats: Provides database statistics including size and usage.
- explain: Provides execution statistics and query plan information.
- mongodb-logs: Returns the most recent logged mongod events.
- get-current-query: Get the current query from the querybar.
- get-current-pipeline: Get the current pipeline from the aggregation builder.
</instructions>
    `.trim();

    const toolCallingOffInabilities = `
<inabilities>
You CANNOT:
1. Access user database information, such as collection schemas, etc. UNLESS this information is explicitly provided to you in the prompt.
2. Query MongoDB directly or execute code.
3. Access the user's current query or aggregation pipeline.
</inabilities>

<instructions>
You SHOULD:
1. Explain to the user that if they enable read-only tool access they will get access to these tools:
- find: Retrieves specific documents that match your search criteria.
- aggregate: Performs complex data processing, grouping, and calculations.
- count: Quickly returns the total number of documents matching a query.
- list-databases: Displays all available databases in the connected cluster.
- list-collections: Shows all collections within a specified database.
- collection-schema: Describes the schema structure of a collection.
- collection-indexes: Lists all indexes defined on a collection.
- collection-storage-size: Returns the storage size information for a collection.
- db-stats: Provides database statistics including size and usage.
- explain: Provides execution statistics and query plan information.
- mongodb-logs: Returns the most recent logged mongod events.
- get-current-query: Get the current query from the querybar.
- get-current-pipeline: Get the current pipeline from the aggregation builder.
</instructions>
`.trim();

    const toolCallingOnAbilities = `
<abilities>
IF the user has a focused connection you CAN:
1. Access user database information, such as collection schemas, etc.
2. Query MongoDB directly.
3. Access the user's current query or aggregation pipeline.
</abilities>

<instructions>
You SHOULD:
1. Always offer to run a tool again if the user asks about data that requires it.
</instructions>
`.trim();

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
          enableGenAIToolCalling: false,
        },
        expected: `The user does not have any tabs open.\n\n${toolCallingOffInabilities}`,
      },
      // No active tab (tools enabled)
      {
        context: {
          activeWorkspace: null,
          activeConnection: null,
          activeCollectionMetadata: null,
          activeCollectionSubTab: null,
          enableGenAIToolCalling: true,
        },
        expected: `${noConnectionInstructions}\n\nThe user does not have any tabs open.\n\n${toolCallingOnAbilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The user is on the "Welcome" tab.\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The user is on the "My Queries" tab.\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The user is on the "Data Modeling" tab.\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Databases" tab.\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Performance" tab.\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Shell" tab.\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Collections" tab for the "test" namespace.\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Schema" tab for the "test.normal" namespace. "test.normal" does not support Atlas Search indexes. Server version: 7.0.0\n\n${toolCallingOffInabilities}`,
      },
      // Collection, Aggregations tab with enableGenAIToolCalling=true
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
          enableGenAIToolCalling: true,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Aggregations" tab for the "test.normal" namespace. "test.normal" does not support Atlas Search indexes. Server version: 7.0.0\n\n${toolCallingOnAbilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Aggregations" tab for the "test.timeseries" namespace. "test.timeseries" is a time-series collection, does not support Atlas Search indexes. Server version: \n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Documents" tab for the "test.view" namespace. "test.view" is a view on the "test.normal" collection, does not support Atlas Search indexes. Server version: 7.0.0\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Schema" tab for the "test.clustered" namespace. "test.clustered" is a clustered collection, does not support Atlas Search indexes. Server version: 7.0.0\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Documents" tab for the "test.encrypted" namespace. "test.encrypted" has encrypted fields, does not support Atlas Search indexes. Server version: 7.0.0\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "cluster.mongodb.net". The redacted connection string is "mongodb+srv://cluster.mongodb.net/". Database tool calls will be made against this connection.\n\nThe user is on the "Indexes" tab for the "test.searchable" namespace. "test.searchable" supports Atlas Search indexes. The instance is Atlas. Server version: 7.0.0\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "datalake.mongodb.net". The redacted connection string is "mongodb+srv://datalake.mongodb.net/". Database tool calls will be made against this connection.\n\nThe user is on the "Documents" tab for the "test.datalake" namespace. "test.datalake" does not support Atlas Search indexes. The instance is Data Lake and Atlas. Server version: 6.0.0\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "cluster.mongodb.net". The redacted connection string is "mongodb+srv://cluster.mongodb.net/". Database tool calls will be made against this connection.\n\nThe user is on the "Aggregations" tab for the "test.multifeature" namespace. "test.multifeature" is a time-series collection, is a clustered collection, has encrypted fields, supports Atlas Search indexes. The instance is Atlas. Server version: 8.0.0\n\n${toolCallingOffInabilities}`,
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
          enableGenAIToolCalling: false,
        },
        expected: `The focused connection is named "localhost:27017". The redacted connection string is "mongodb://localhost:27017/". Database tool calls will be made against this connection.\n\nThe user is on the "Documents" tab for the "test.noversion" namespace. "test.noversion" does not support Atlas Search indexes. Server version: 7.0.0\n\n${toolCallingOffInabilities}`,
      },
    ];

    for (const testCase of testCases) {
      const summary: {
        [key: string]: string | boolean;
      } = {};
      summary.enableGenAIToolCalling =
        testCase.context.enableGenAIToolCalling ?? false;
      summary.type = testCase.context.activeWorkspace?.type || 'No active tab';
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
