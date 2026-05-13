import { z } from 'zod';
import { MongoDBToolBase } from 'mongodb-mcp-server/tools';
import type { OperationType } from 'mongodb-mcp-server/tools';

/**
 * Replacement for the upstream `connect` tool that takes a Compass connection
 * ID instead of a raw MongoDB connection string. External AI clients should
 * never see or handle real connection strings — they pick from connections the
 * user has already saved in Compass.
 *
 * Internally we still call `session.connectToMongoDB({ connectionString })`,
 * but CompassConnectionManager treats that field as a connection ID and looks
 * up the actual credentials from Compass storage.
 */
export class CompassConnectTool extends MongoDBToolBase {
  static toolName = 'connect';
  static operationType: OperationType = 'connect';

  description =
    'Connect to one of the MongoDB connections saved in Compass. ' +
    'Required workflow before any data / metadata tool can be used:\n' +
    '  1. Call `list-connections` to get the user’s saved Compass ' +
    'connections (each has an `id` and `name`).\n' +
    '  2. Call this `connect` tool with `connectionId` set to one of ' +
    'those ids.\n' +
    'This server does NOT accept connection strings. Never ask the user ' +
    'for a connection string and never pass one to this tool — only ' +
    'connectionId values from list-connections are valid. If you receive ' +
    'a "not connected" error from another tool, follow steps 1 and 2 ' +
    'above rather than asking the user for a connection string.';

  argsShape = {
    connectionId: z
      .string()
      .describe(
        'The id of a Compass connection. Call list-connections first to discover available ids.'
      ),
  };

  protected async execute({
    connectionId,
  }: {
    connectionId: string;
  }): ReturnType<MongoDBToolBase['handleError']> {
    // CompassConnectionManager treats `connectionString` as a Compass id.
    await this.session.connectToMongoDB({ connectionString: connectionId });
    return {
      content: [
        {
          type: 'text' as const,
          text: `Connected to Compass connection ${connectionId}.`,
        },
      ],
    };
  }
}
