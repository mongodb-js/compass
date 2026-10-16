import type {
  ConnectionErrorUnhandled,
  ConnectionErrorHandler,
} from '@mongodb-js/mcp-tools-mongodb';

/**
 * Creates a connection error handler for mongodb-mcp-server in Compass.
 * This handler is called when connection errors occur in mongodb-mcp-server.
 */
export function createConnectionErrorHandler(): ConnectionErrorHandler {
  return function (): ConnectionErrorUnhandled {
    return {
      errorHandled: false,
    };
  };
}
