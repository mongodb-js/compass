import type { ConnectionErrorHandler } from 'mongodb-mcp-server';

/**
 * Compass-specific replacement for the upstream `connectionErrorHandler`.
 *
 * The upstream default tells the AI to "use the `connect` tool" with a
 * connection string, or to update the MCP server config with one. That
 * message doesn't match our model: our `connect` tool takes a
 * `connectionId` produced by `list-connections`, and AI clients must
 * never see or invent a connection string. When the AI followed the
 * upstream message, it asked the user for a connection string, didn't
 * get one, and gave up instead of calling `list-connections`.
 *
 * This handler intercepts the "not connected" / "misconfigured" cases
 * and returns a result that explicitly walks the AI through the right
 * path: call `list-connections` to discover Compass connections by id,
 * then `connect` with one of those ids. No connection strings.
 */
export const compassConnectionErrorHandler: ConnectionErrorHandler = () => {
  return {
    errorHandled: true,
    result: {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text:
            'No active MongoDB connection. To work with a database in ' +
            'MongoDB Compass:\n' +
            '  1. Call `list-connections` to get the ids of the user’s ' +
            'saved Compass connections.\n' +
            '  2. Call `connect` with `connectionId` set to the id of the ' +
            'connection you want to use.\n' +
            'Do NOT ask the user for a connection string and do NOT pass ' +
            'a connection string to `connect` — this server only accepts ' +
            'Compass connection ids. If `list-connections` returns an ' +
            'empty list, tell the user to add a connection in Compass first.',
        },
      ],
    },
  };
};
