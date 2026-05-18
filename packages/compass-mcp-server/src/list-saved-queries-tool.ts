import { z } from 'zod';
import {
  ToolBase,
  type ToolCategory,
  type OperationType,
  type ToolExecutionContext,
} from 'mongodb-mcp-server/tools';
import type { CompassToolContext } from './compass-tool-context';

/**
 * MCP tool that returns the catalog of saved queries + saved aggregations
 * the user has annotated with a description. The AI is instructed (via
 * the COMPASS_INSTRUCTIONS string) to call this BEFORE composing a fresh
 * query, so it can re-use tested queries the team has already curated
 * instead of inventing one from scratch.
 *
 * The catalog is intentionally lightweight: each item carries enough
 * metadata for the AI to decide whether it fits the user's request
 * (`description`, `namespace`, `name`, `type`) plus the actual body so the
 * AI can either run it verbatim or adapt it. Execution still goes through
 * the existing `find` / `aggregate` / `count` / `update-many` tools — the
 * AI substitutes the saved body into the right tool call.
 *
 * Operation type is `metadata`: this tool only reads Compass's local
 * saved-query store; it never touches MongoDB.
 */
export class ListSavedQueriesTool extends ToolBase<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  CompassToolContext
> {
  static toolName = 'list-saved-queries';
  static category: ToolCategory = 'mongodb';
  static operationType: OperationType = 'metadata';

  description =
    'List saved queries and saved aggregations in MongoDB Compass that ' +
    'the user (or previous AI sessions) annotated with a description. ' +
    'Call this BEFORE composing a fresh find or aggregate from scratch — ' +
    'if a saved item matches the user’s intent, prefer running it ' +
    '(via the existing find / aggregate / count / update-many tools) ' +
    'over re-inventing the query, because saved items are typically ' +
    'tuned for the right indexes. ' +
    'Returned items include `type` (query or aggregation), `namespace`, ' +
    '`name`, `description`, and the body. Items without a description are ' +
    'omitted from this catalog.';

  argsShape = {
    namespace: z
      .string()
      .optional()
      .describe(
        'Optional. If provided, only saved items targeting this namespace ' +
          '(`database.collection`) are returned. Useful when you already ' +
          'know which collection the user is asking about.'
      ),
  };

  protected async execute(
    args: { namespace?: string },
    _context: ToolExecutionContext
  ) {
    if (!this.context) {
      return { content: [{ type: 'text' as const, text: '[]' }] };
    }
    this.context.checkAccess('list-saved-queries');
    const all = await this.context.listSavedQueries();
    const filtered = args.namespace
      ? all.filter((item) => item.namespace === args.namespace)
      : all;
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(filtered, null, 2),
        },
      ],
    };
  }

  protected resolveTelemetryMetadata(): Record<string, unknown> {
    return {};
  }
}
