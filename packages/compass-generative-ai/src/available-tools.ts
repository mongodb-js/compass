import type { AllPreferences } from 'compass-preferences-model';

type ToolDefinition = {
  name: string;
  description: string;
  readonly: boolean;
};

export const READ_ONLY_DATABASE_TOOLS: ToolDefinition[] = [
  {
    name: 'find',
    readonly: true,
    description:
      'Retrieves specific documents that match your search criteria.',
  },
  {
    name: 'aggregate',
    readonly: true,
    description:
      'Performs complex data processing, grouping, and calculations.',
  },
  {
    name: 'count',
    readonly: true,
    description:
      'Quickly returns the total number of documents matching a query.',
  },
  {
    name: 'list-databases',
    readonly: true,
    description: 'Displays all available databases in the connected cluster.',
  },
  {
    name: 'list-collections',
    readonly: true,
    description: 'Shows all collections within a specified database.',
  },
  {
    name: 'collection-schema',
    readonly: true,
    description: 'Describes the schema structure of a collection.',
  },
  {
    name: 'collection-indexes',
    readonly: true,
    description: 'Lists all indexes defined on a collection.',
  },
  {
    name: 'collection-storage-size',
    readonly: true,
    description: 'Returns the storage size information for a collection.',
  },
  {
    name: 'db-stats',
    readonly: true,
    description: 'Provides database statistics including size and usage.',
  },
  {
    name: 'explain',
    readonly: true,
    description: 'Provides execution statistics and query plan information.',
  },
  {
    name: 'mongodb-logs',
    readonly: true,
    description: 'Returns the most recent logged mongod events.',
  },
];

export const getAvailableTools = ({
  enableAtlasConnectionErrorDebugger,
}: Pick<
  AllPreferences,
  'enableAtlasConnectionErrorDebugger'
>): ToolDefinition[] => {
  const tools = [
    ...READ_ONLY_DATABASE_TOOLS,
    {
      name: 'get-current-query',
      readonly: true,
      description: 'Get the current query from the querybar.',
    },
    {
      name: 'get-current-pipeline',
      readonly: true,
      description: 'Get the current pipeline from the aggregation builder.',
    },
    ...(enableAtlasConnectionErrorDebugger
      ? [
          {
            name: 'atlas-connection-error-debugger',
            readonly: true,
            description:
              'Use to debug a Compass connection failure to an Atlas cluster. Returns Atlas-side diagnostics (cluster state, IP access list).',
          },
        ]
      : []),
  ];
  return tools;
};

export function doesToolUseConnection(toolName: string): boolean {
  return READ_ONLY_DATABASE_TOOLS.map((tool) => tool.name).includes(toolName);
}

export function isReadOnlyTool(toolName: string): boolean {
  return (
    getAvailableTools({ enableAtlasConnectionErrorDebugger: true }).find(
      (tool) => tool.name === toolName
    )?.readonly || false
  );
}
