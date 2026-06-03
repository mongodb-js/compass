/**
 * Saved-query catalog the MCP server exposes to AI clients.
 *
 * "Saved query" here unifies two things Compass stores separately under the
 * hood:
 *   - `FavoriteQuery`  — a find / count / updateMany payload saved by the
 *                        user from the Documents tab.
 *   - `SavedPipeline`  — an aggregation pipeline saved from the
 *                        Aggregations tab.
 *
 * Both gain a `description` field that we surface to the AI. The AI reads
 * the catalog via the `list-saved-queries` tool before composing a fresh
 * query, and authors new entries via `save-saved-query`. The actual
 * execution still goes through the existing `find` / `aggregate` /
 * `count` / `update-many` tools — the AI substitutes the saved body into
 * the appropriate tool call.
 *
 * This interface is duck-typed on purpose so `compass-mcp-server` doesn't
 * have to take `my-queries-storage` as a runtime dependency. The Compass
 * main process provides an adapter that wraps the real storage instances.
 */

/** Items visible to the AI catalog. Discriminated by `type`. */
export type SavedQueryItem =
  | {
      type: 'query';
      id: string;
      namespace: string;
      name: string;
      description: string;
      authoredBy: 'ai' | 'human';
      /**
       * When set, the MCP server registers this saved query as an MCP
       * prompt under this name (e.g. `search-trips` surfaces as
       * `/search-trips` in AI clients' slash menus).
       */
      mcpPromptName?: string;
      lastModified?: Date;
      filter?: unknown;
      project?: unknown;
      sort?: unknown;
      collation?: unknown;
      skip?: number;
      limit?: number;
    }
  | {
      type: 'aggregation';
      id: string;
      namespace: string;
      name: string;
      description: string;
      authoredBy: 'ai' | 'human';
      mcpPromptName?: string;
      lastModified?: Date;
      pipelineText: string;
    };

/** Payload accepted by `saveQuery` (FavoriteQuery side of the catalog). */
export interface SaveQueryInput {
  name: string;
  description: string;
  namespace: string;
  /** Optional slash-command name. See `SavedQueryItem.mcpPromptName`. */
  mcpPromptName?: string;
  filter?: unknown;
  project?: unknown;
  sort?: unknown;
  collation?: unknown;
  skip?: number;
  limit?: number;
}

/** Payload accepted by `saveAggregation` (SavedPipeline side of the catalog). */
export interface SaveAggregationInput {
  name: string;
  description: string;
  namespace: string;
  mcpPromptName?: string;
  pipelineText: string;
}

export interface McpSavedQueryStorage {
  /**
   * Returns saved queries + aggregations that have a non-empty
   * `description`. Items without a description are filtered out — they
   * were saved before the field existed (or the human author didn't fill
   * one in), and including them in the AI catalog would pollute the
   * tool's signal-to-noise.
   */
  loadDescribed(): Promise<SavedQueryItem[]>;

  /** Persist a new FavoriteQuery. Returns the generated id. */
  saveQuery(input: SaveQueryInput): Promise<{ id: string }>;

  /** Persist a new SavedPipeline. Returns the generated id. */
  saveAggregation(input: SaveAggregationInput): Promise<{ id: string }>;
}
