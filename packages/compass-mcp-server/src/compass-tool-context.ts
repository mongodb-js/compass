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
 * Per-session context that gets handed to every Compass MCP tool. Each tool
 * receives this object as `this.context` and uses it to talk back to Compass
 * (list saved connections, open a workspace tab in the renderer, etc.) without
 * importing Electron APIs directly — keeps tools portable and testable.
 */
export interface CompassToolContext {
  /**
   * Returns the list of MongoDB connections the user has saved in Compass.
   * The `id` field is what AI clients should pass to the `connect` tool.
   */
  getAllConnections: () => Promise<
    Array<{ id: string; name: string; mcpAccess?: 'allowed' | 'denied' }>
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
}
