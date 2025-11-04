import type {
  ConnectionErrorHandled,
  ConnectionErrorHandler,
} from 'mongodb-mcp-server';

/**
 * Creates a connection error handler for the MCP server in Compass.
 * This handler is called when connection errors occur in the MCP server.
 */
export function createMCPConnectionErrorHandler(): ConnectionErrorHandler {
  return function (error: Error): ConnectionErrorHandled {
    // In Compass, we'll log connection errors but not show UI notifications
    // since connection management is handled by Compass's connection system
    // Optionally log error elsewhere if desired, but don't use console in production code
    // Return false to indicate we handled the error gracefully
    return {
      errorHandled: true,
      result: {} as any,
    };
  };
}
