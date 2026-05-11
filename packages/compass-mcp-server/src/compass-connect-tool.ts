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
    'The connectionId argument must be the id field returned by the ' +
    'list-connections tool — do NOT pass a connection string.';

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
