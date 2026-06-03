import { z } from 'zod';
import {
  ToolBase,
  type ToolCategory,
  type OperationType,
  type ToolExecutionContext,
} from 'mongodb-mcp-server/tools';
import type { CompassToolContext } from './compass-tool-context';

/**
 * MCP tool that lets the AI persist a useful query / aggregation into the
 * Compass saved-queries catalog. Counterpart to `list-saved-queries`: the
 * AI helps the user craft a query in chat, the user expresses
 * satisfaction, the AI offers to save it for next time.
 *
 * The created entry is tagged `authoredBy: 'ai'` so users can audit /
 * clean up AI-authored items from the existing Compass saved-queries UI.
 * No live consent dialog in v1 — the AI is expected to confirm intent in
 * chat before calling this tool, and bad entries can be deleted from the
 * UI.
 *
 * Two flavors selected by `type`:
 *   - `query`       — a find / count / update payload (FavoriteQuery shape).
 *   - `aggregation` — a saved pipeline (SavedPipeline shape).
 *
 * Operation type is `metadata`: this tool writes Compass's local
 * saved-query store; it never touches MongoDB. Available under every
 * access preset because it's a workspace-side write, not a data write.
 */
export class SaveSavedQueryTool extends ToolBase<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  CompassToolContext
> {
  static toolName = 'save-saved-query';
  static category: ToolCategory = 'mongodb';
  static operationType: OperationType = 'metadata';

  description =
    'Save a query or aggregation pipeline into the MongoDB Compass ' +
    'saved-queries catalog so it can be re-discovered and re-run later ' +
    'via `list-saved-queries`. Use this when the user explicitly confirms ' +
    'they want to save a query you just helped them craft. Always include ' +
    'a clear `description` so the saved item is discoverable from ' +
    '`list-saved-queries` later. Pick `type: "query"` for find / count / ' +
    'updateMany payloads and `type: "aggregation"` for pipelines.';

  argsShape = {
    type: z
      .enum(['query', 'aggregation'])
      .describe(
        '`query` for find / count / updateMany shaped items (filter, ' +
          'project, sort, etc.); `aggregation` for saved pipelines.'
      ),
    name: z
      .string()
      .min(1)
      .describe(
        'Short identifier for the saved item. Will be the user-facing name ' +
          'in the Compass saved-queries UI.'
      ),
    description: z
      .string()
      .min(1)
      .describe(
        'Human-readable description of what the query does. Required: this ' +
          'is what makes the item discoverable to future AI sessions via ' +
          '`list-saved-queries`. Keep it specific enough that another agent ' +
          'can decide whether to use it.'
      ),
    namespace: z
      .string()
      .describe(
        'Target namespace in `database.collection` form, e.g. ' +
          '`sample_mflix.movies`.'
      ),
    mcpPromptName: z
      .string()
      .optional()
      .describe(
        'Optional. If set, the MCP server publishes this saved item as an ' +
          'MCP prompt under this name, so AI clients can surface it in their ' +
          'slash menu (e.g. `/search-trips`). Must be kebab-case: lowercase ' +
          'letters, digits, hyphens; start with a letter; 1–64 chars. The ' +
          'server silently ignores this hint when the name is already taken; ' +
          'the user can rename the prompt later from the Compass UI.'
      ),
    filter: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        'For `type: "query"`. The find filter document as plain JSON; use ' +
          '{"$oid": "..."} for ObjectIds.'
      ),
    project: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('For `type: "query"`. The projection document.'),
    sort: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('For `type: "query"`. The sort document.'),
    collation: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('For `type: "query"`. The collation document.'),
    skip: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('For `type: "query"`. Skip N documents.'),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('For `type: "query"`. Limit to N documents.'),
    pipelineText: z
      .string()
      .optional()
      .describe(
        'For `type: "aggregation"`. The pipeline source as a JavaScript ' +
          'array literal — e.g. `[{ $match: { ... } }, { $group: { ... } }]`. ' +
          'This is the textual form Compass renders in its aggregation ' +
          'builder.'
      ),
  };

  protected async execute(
    args: {
      type: 'query' | 'aggregation';
      name: string;
      description: string;
      namespace: string;
      mcpPromptName?: string;
      filter?: Record<string, unknown>;
      project?: Record<string, unknown>;
      sort?: Record<string, unknown>;
      collation?: Record<string, unknown>;
      skip?: number;
      limit?: number;
      pipelineText?: string;
    },
    _context: ToolExecutionContext
  ) {
    if (!this.context) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Compass saved-query storage is not available in this session.',
          },
        ],
        isError: true,
      };
    }
    this.context.checkAccess('save-saved-query');

    if (args.type === 'aggregation') {
      if (!args.pipelineText) {
        return {
          content: [
            {
              type: 'text' as const,
              text: '`pipelineText` is required when `type` is "aggregation".',
            },
          ],
          isError: true,
        };
      }
      const { id } = await this.context.saveSavedAggregation({
        name: args.name,
        description: args.description,
        namespace: args.namespace,
        pipelineText: args.pipelineText,
        ...(args.mcpPromptName ? { mcpPromptName: args.mcpPromptName } : {}),
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: `Saved aggregation "${args.name}" (id ${id}) for ${args.namespace}.`,
          },
        ],
      };
    }

    // Only forward fields the AI actually provided — keeps the persisted
    // record clean and the test assertions reliable.
    const queryInput: Parameters<CompassToolContext['saveSavedQuery']>[0] = {
      name: args.name,
      description: args.description,
      namespace: args.namespace,
    };
    if (args.filter !== undefined) queryInput.filter = args.filter;
    if (args.project !== undefined) queryInput.project = args.project;
    if (args.sort !== undefined) queryInput.sort = args.sort;
    if (args.collation !== undefined) queryInput.collation = args.collation;
    if (args.skip !== undefined) queryInput.skip = args.skip;
    if (args.limit !== undefined) queryInput.limit = args.limit;
    if (args.mcpPromptName !== undefined) {
      queryInput.mcpPromptName = args.mcpPromptName;
    }
    const { id } = await this.context.saveSavedQuery(queryInput);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Saved query "${args.name}" (id ${id}) for ${args.namespace}.`,
        },
      ],
    };
  }

  protected resolveTelemetryMetadata(): Record<string, unknown> {
    return {};
  }
}
