import { z } from 'zod';
import {
  ToolBase,
  type ToolCategory,
  type OperationType,
  type ToolExecutionContext,
} from 'mongodb-mcp-server/tools';
import type {
  CompassToolContext,
  OpenCollectionOptions,
} from './compass-tool-context';

const SUBTABS = [
  'Documents',
  'Aggregations',
  'Schema',
  'Indexes',
  'Validation',
] as const;

/**
 * MCP tool that asks the Compass GUI to open a specific collection in a
 * workspace tab so the user can browse / query / aggregate it interactively.
 *
 * Hand-off pattern: this tool does not return any data. Use it when the
 * user will benefit from interacting with Compass's UI (refining a query,
 * stepping through an aggregation pipeline, examining the schema view, or
 * inspecting indexes) — NOT to just display query results, which should be
 * returned inline by the corresponding read tool.
 *
 * Compass handles connecting / authenticating to the connection if needed,
 * so the AI never needs to call `connect` first.
 */
export class CompassOpenCollectionTool extends ToolBase<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  CompassToolContext
> {
  static toolName = 'compass-open-collection';
  static category: ToolCategory = 'mongodb';
  static operationType: OperationType = 'metadata';

  description =
    'Open a collection in the MongoDB Compass UI for the user to interact ' +
    'with. Use this when the user will iterate on a query, step through ' +
    'an aggregation pipeline, inspect schema / indexes, or otherwise ' +
    'benefit from a visual workspace — NOT to just show query results ' +
    '(return those inline via find / aggregate / count). ' +
    'Optionally pre-fills a find query (filter / projection / sort / limit) ' +
    'or an aggregation pipeline; pick the matching subtab if you do. ' +
    'Call list-connections first for the connectionId — this tool does ' +
    'NOT accept a connection string.';

  argsShape = {
    connectionId: z
      .string()
      .describe('The id of a Compass connection (from list-connections).'),
    database: z.string().describe('Database name.'),
    collection: z.string().describe('Collection name.'),
    subtab: z
      .enum(SUBTABS)
      .optional()
      .describe(
        'Which collection subtab to open. Defaults to Documents. Use ' +
          '"Aggregations" when supplying a pipeline, "Schema" for schema ' +
          'exploration, "Indexes" to suggest or inspect indexes.'
      ),
    filter: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        'Optional MongoDB find filter to pre-fill the query bar with ' +
          '(Documents subtab). Plain JSON; use {"$oid": "..."} for ObjectIds.'
      ),
    projection: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Optional projection to pre-fill the query bar with.'),
    sort: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Optional sort spec to pre-fill the query bar with.'),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Optional limit to pre-fill the query bar with.'),
    pipeline: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .describe(
        'Optional aggregation pipeline (array of stage objects) to ' +
          'pre-fill the Aggregations subtab with. Implies subtab: ' +
          '"Aggregations" if subtab is not set explicitly.'
      ),
  };

  protected async execute(
    args: {
      connectionId: string;
      database: string;
      collection: string;
      subtab?: (typeof SUBTABS)[number];
      filter?: Record<string, unknown>;
      projection?: Record<string, unknown>;
      sort?: Record<string, unknown>;
      limit?: number;
      pipeline?: Record<string, unknown>[];
    },
    _context: ToolExecutionContext
  ) {
    if (!this.context) {
      return await Promise.resolve({
        content: [
          {
            type: 'text' as const,
            text: 'Compass UI is not available in this session.',
          },
        ],
      });
    }
    this.context.checkAccess('compass-open-collection');

    const {
      connectionId,
      database,
      collection,
      subtab,
      filter,
      projection,
      sort,
      limit,
      pipeline,
    } = args;
    const namespace = `${database}.${collection}`;

    // Build the (optional) initialQuery from the individual fields. The
    // collection-tab plugin reads `query` shaped like { filter, projection,
    // sort, limit }, so we forward only the fields the AI provided.
    let initialQuery: Record<string, unknown> | undefined;
    if (filter || projection || sort || limit !== undefined) {
      initialQuery = {
        ...(filter ? { filter } : {}),
        ...(projection ? { project: projection } : {}),
        ...(sort ? { sort } : {}),
        ...(limit !== undefined ? { limit } : {}),
      };
    }

    const effectiveSubtab = subtab ?? (pipeline ? 'Aggregations' : undefined);

    const options: OpenCollectionOptions = {
      subtab: effectiveSubtab,
      initialQuery,
      initialPipeline: pipeline,
    };

    this.context.openCollection(connectionId, namespace, options);

    const what =
      pipeline && (effectiveSubtab ?? 'Aggregations') === 'Aggregations'
        ? `${database}.${collection} with a ${pipeline.length}-stage aggregation pipeline`
        : initialQuery
        ? `${database}.${collection} with a pre-filled query`
        : effectiveSubtab && effectiveSubtab !== 'Documents'
        ? `${database}.${collection} (${effectiveSubtab} tab)`
        : `${database}.${collection}`;

    return await Promise.resolve({
      content: [
        {
          type: 'text' as const,
          text: `Opened ${what} in MongoDB Compass.`,
        },
      ],
    });
  }

  protected resolveTelemetryMetadata(): Record<string, unknown> {
    return {};
  }
}
