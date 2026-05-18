// Public API surface for `@mongodb-js/compass-mcp-server`.
//
// Only two consumers:
//   - the Compass main process (`packages/compass/src/main/...`) calls
//     `CompassMcpServerManager.init` / `.onExit` and runs `runStdioBridge`
//     when launched with `--mcp-stdio`.
//   - the connection-form's AI access tab reads `presetTools` / `presetLabel`
//     / `ALL_PRESETS` to render the preset previews.
//
// Anything internal stays internal: the socket server, the connection
// manager, the tool classes, etc., are not re-exported.
export { CompassMcpServerManager } from './compass-mcp-server-manager';
export type { McpConnectionStorage } from './compass-mcp-server-manager';
export type {
  McpSavedQueryStorage,
  SaveAggregationInput,
  SaveQueryInput,
  SavedQueryItem,
} from './mcp-saved-query-storage';
export { runStdioBridge } from './stdio-bridge';
export { presetLabel, presetTools, ALL_PRESETS } from './presets';
export { MCP_IPC } from './ipc-channels';
