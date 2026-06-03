import type { McpAccess } from '@mongodb-js/connection-info';
import type {
  SaveAggregationInput,
  SaveQueryInput,
  SavedQueryItem,
} from './mcp-saved-query-storage';

export type CollectionSubtab =
  | 'Documents'
  | 'Aggregations'
  | 'Schema'
  | 'Indexes'
  | 'Validation';

export interface OpenCollectionOptions {
  /** Which subtab to land on. Defaults to Documents in the renderer. */
  subtab?: CollectionSubtab;
  /**
   * Pre-fill the documents-tab query bar. Shape mirrors what the collection
   * plugin consumes (`{ filter, project, sort, limit }`).
   */
  initialQuery?: Record<string, unknown>;
  /** Pre-fill the aggregation builder with this pipeline. */
  initialPipeline?: Record<string, unknown>[];
}

/**
 * Thrown by `CompassToolContext.checkAccess` when the active connection's
 * preset does not include the requested tool. Caught at the tool boundary
 * and surfaced to the AI as a clear `isError` result.
 */
export class McpAccessDeniedError extends Error {
  readonly toolName: string;
  readonly preset: string;
  constructor(toolName: string, preset: string) {
    super(
      `Access denied by Compass: this connection's access preset (${preset}) ` +
        `does not include the '${toolName}' tool. Open Compass → connection ` +
        `settings → AI access to change.`
    );
    this.name = 'McpAccessDeniedError';
    this.toolName = toolName;
    this.preset = preset;
  }
}

/**
 * Per-session context that gets handed to every Compass MCP tool. Each tool
 * receives this object as `this.context` and uses it to talk back to Compass
 * (list saved connections, open a workspace tab in the renderer, etc.) without
 * importing Electron APIs directly — keeps tools portable and testable.
 */
export interface CompassToolContext {
  /**
   * Returns the list of MongoDB connections the user has saved in Compass.
   * The `id` field is what AI clients should pass to the `connect` tool.
   * `access` reflects the configured per-connection MCP policy.
   */
  getAllConnections: () => Promise<
    Array<{
      id: string;
      name: string;
      access: McpAccess;
    }>
  >;

  /**
   * Navigate the Compass GUI to a collection workspace. Called by the
   * `compass-open-collection` tool. Fire-and-forget — the AI gets an
   * acknowledgement immediately; if the connection isn't active, Compass
   * itself handles prompting the user to connect.
   */
  openCollection: (
    connectionId: string,
    namespace: string,
    options?: OpenCollectionOptions
  ) => void;

  /**
   * Verify the active connection's preset allows this tool to run. Throws
   * `McpAccessDeniedError` when it doesn't. No-op when no connection is
   * active (e.g. tools like `list-connections` or `connect` that run before
   * a connection exists).
   */
  checkAccess: (toolName: string) => void;

  /**
   * Returns saved queries + aggregations the AI catalog can see. Items
   * without a `description` are filtered out by the underlying storage —
   * the AI only sees items the user (or a previous AI session) annotated.
   */
  listSavedQueries: () => Promise<SavedQueryItem[]>;

  /**
   * Persist a new FavoriteQuery on behalf of the AI. The created entry is
   * tagged `authoredBy: 'ai'` so users can audit / clean up AI-authored
   * items from the Compass saved-queries UI.
   */
  saveSavedQuery: (input: SaveQueryInput) => Promise<{ id: string }>;

  /** Persist a new SavedPipeline on behalf of the AI. Tagged similarly. */
  saveSavedAggregation: (input: SaveAggregationInput) => Promise<{
    id: string;
  }>;
}
