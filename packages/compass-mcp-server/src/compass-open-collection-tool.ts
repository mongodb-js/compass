import { z } from 'zod';
import {
  ToolBase,
  type ToolCategory,
  type OperationType,
  type ToolExecutionContext,
} from 'mongodb-mcp-server/tools';
import type { CompassToolContext } from './compass-tool-context';

/**
 * MCP tool that asks the Compass GUI to open a specific collection in a
 * workspace tab so the user can browse / query it interactively. Useful when
 * the AI wants to show data rather than dump documents back as text — e.g.
 * "Let me open that collection for you to look at."
 *
 * No MongoDB query is performed by this tool: it just sends a navigation
 * intent over IPC. Compass handles connecting/authenticating if needed, and
 * the result is purely a UX effect on the user's machine.
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
    'Open a collection in the MongoDB Compass UI for the user to browse ' +
    'interactively. Use this when the user would benefit from seeing the ' +
    'data in Compass (sorting, filtering, schema view, indexes) rather ' +
    'than receiving documents inline. Call list-connections first to find ' +
    'the connectionId; this tool does NOT accept a connection string.';

  argsShape = {
    connectionId: z
      .string()
      .describe('The id of a Compass connection (from list-connections).'),
    database: z.string().describe('Database name.'),
    collection: z.string().describe('Collection name.'),
  };

  protected async execute(
    {
      connectionId,
      database,
      collection,
    }: {
      connectionId: string;
      database: string;
      collection: string;
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
    this.context.openCollection(connectionId, `${database}.${collection}`);
    return await Promise.resolve({
      content: [
        {
          type: 'text' as const,
          text: `Opened ${database}.${collection} in MongoDB Compass.`,
        },
      ],
    });
  }

  protected resolveTelemetryMetadata(): Record<string, unknown> {
    return {};
  }
}
