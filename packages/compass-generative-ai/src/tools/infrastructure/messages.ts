import type { EventSource } from '@mongodb-js/compass-utils';

export type ToolsRpcPort = {
  postMessage(message: unknown): void;
  close(): void;
} & EventSource;

export type ToolsRpcMethod =
  /**
   * Keeps the MCP server's runtime config in sync with Compass preferences.
   * Sent by the renderer every time the assistant context changes. It replaces
   * the direct `runner.userConfig` mutation `ToolsController.setContext` used
   * to do when the server lived in the renderer.
   */
  | 'setUserConfig'
  /**
   * Fetches the read-only database tool definitions: name, description and
   * input schema as JSON Schema. Sent once when the connection is established,
   * doubling as the handshake; the result is cached renderer-side so
   * `getActiveTools()` can stay synchronous.
   */
  | 'listDatabaseTools'
  /**
   * Executes one database tool. Sent by the renderer per AI tool call.
   * The utility connects the driver to the given connection, invokes the tool
   * with the request's abort signal (identified via the abort-for-id pattern,
   * see `rpc-client.ts`), disconnects in `finally`, and resolves with the
   * tool result, which is plain data.
   */
  | 'performToolCall'
  /**
   * Closes the MCP server. Sent on provider unmount / window close. The
   * utility additionally tears down a host when its port closes, which covers
   * a renderer crash that can never deliver this message.
   */
  | 'stopServer';

export type ToolsRpcRequest = {
  kind: 'request';
  id: number;
  method: ToolsRpcMethod;
  params: unknown;
};

export type ToolsRpcResponse = { kind: 'response'; id: number } & (
  { ok: true; result: unknown } | { ok: false; error: string }
);

export type ToolsRpcAbort = { kind: 'abort'; id: number };

export type ToolsRpcMessage =
  ToolsRpcRequest | ToolsRpcResponse | ToolsRpcAbort;

export function isToolsRpcMessage(value: unknown): value is ToolsRpcMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    ['request', 'response', 'abort'].includes(value.kind as string)
  );
}

export function isResponse(value: unknown): value is ToolsRpcResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind: unknown }).kind === 'response'
  );
}
