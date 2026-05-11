import {
  ToolBase,
  type ToolCategory,
  type OperationType,
  type ToolExecutionContext,
} from 'mongodb-mcp-server/tools';

export interface ListConnectionsContext {
  getAllConnections: () => Promise<
    Array<{ id: string; name: string; mcpAccess?: 'allowed' | 'denied' }>
  >;
}

/**
 * MCP tool that lists all Compass connections, so external AI clients can
 * discover which connection IDs to pass to the connect tool.
 */
export class ListConnectionsTool extends ToolBase<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  ListConnectionsContext
> {
  static toolName = 'list-connections';
  static category: ToolCategory = 'mongodb';
  static operationType: OperationType = 'metadata';

  description =
    'Lists all MongoDB connections configured in Compass. Returns connection IDs and display names. Use the id value when calling the connect tool.';

  argsShape = {};

  protected async execute(
    _args: Record<string, never>,
    _context: ToolExecutionContext
  ) {
    if (!this.context) {
      return { content: [{ type: 'text' as const, text: '[]' }] };
    }
    const connections = await this.context.getAllConnections();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(connections, null, 2),
        },
      ],
    };
  }

  protected resolveTelemetryMetadata(): Record<string, unknown> {
    return {};
  }
}
